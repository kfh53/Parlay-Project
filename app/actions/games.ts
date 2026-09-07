"use server";

import { getSupabaseServerClient } from "@/lib/supabase-server";
import { FootballStage, getFootballMetadata } from "@/lib/football-calendar";
import { abbreviateMatchup, PRIME_TIME_GAMES_2026 } from "@/lib/prime-time-schedule";
import { getPrimetimeType } from "@/lib/primetime-type";
import { revalidatePath } from "next/cache";
import { easternKickoffToIso, scheduledKickoffToIso } from "@/lib/game-time";

function optionalInteger(value: FormDataEntryValue | null, label: string) {
    if (value === null || value.toString().trim() === "") return null;

    const number = Number.parseInt(value.toString(), 10);
    if (!Number.isInteger(number)) {
        throw new Error(`${label} must be a whole number.`);
    }

    return number;
}

export async function createGame(formData: FormData) {

    const supabase =
        await getSupabaseServerClient();


    const title =
        formData.get("title")?.toString();


    const gameDate =
        formData.get("gameDate")?.toString();
    const season = optionalInteger(formData.get("season"), "Season");
    const week = optionalInteger(formData.get("week"), "Week");
    const stage = formData.get("stage")?.toString() || null;
    const notes = formData.get("notes")?.toString().trim() || null;

    if (stage && !["regular", "wild_card", "divisional", "conference", "super_bowl"].includes(stage)) {
        throw new Error("Invalid stage.");
    }


    if (!title || !gameDate) {
        throw new Error(
            "Game title and date are required."
        );
    }

    const footballMetadata = getFootballMetadata(gameDate);
    const startsAt = easternKickoffToIso(gameDate, formData.get("gameTime")?.toString() ?? "");
    const resolvedStage = (stage as FootballStage | null) ?? footballMetadata.stage;


    const {
        data: {
            user
        }
    } = await supabase.auth.getUser();


    if (!user) {
        throw new Error(
            "User not authenticated"
        );
    }


    const { error } =
        await supabase
            .from("parlays")
            .insert({
                title,
                game_date: gameDate,
                starts_at: startsAt,
                status: "upcoming",
                result: null,
                total_odds: null,
                notes,
                created_by: user.id,
                season: season ?? footballMetadata.season,
                week: week ?? footballMetadata.week,
                stage: resolvedStage,
                primetime_type: getPrimetimeType(gameDate, resolvedStage)
            });


    if (error) {
        console.log(error);
        throw error;
    }


    revalidatePath("/dashboard");
}

export async function ensurePrimeTimeGames() {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const [existingResult, dismissedResult] = await Promise.all([
        supabase
            .from("parlays")
            .select("id, title, game_date, starts_at")
            .eq("season", 2026),
        supabase
            .from("dismissed_games")
            .select("title, game_date")
    ]);

    const { data: existing, error: selectError } = existingResult;

    if (selectError) {
        console.error("Unable to check the prime-time schedule:", selectError);
        return;
    }

    if (dismissedResult.error) {
        console.error("Unable to check dismissed schedule games:", dismissedResult.error);
        return;
    }

    const scheduledDates = new Map(
        (existing ?? []).map(game => [`${game.game_date}|${game.title}`, game])
    );
    // Fill known schedule times only when missing; preserve manually edited kickoffs.
    for (const game of PRIME_TIME_GAMES_2026) {
        const existingGame = scheduledDates.get(`${game.gameDate}|${abbreviateMatchup(game.title)}`)
            ?? scheduledDates.get(`${game.gameDate}|${game.title}`);
        if (!existingGame || existingGame.starts_at) continue;
        const { error } = await supabase.from("parlays")
            .update({ starts_at: scheduledKickoffToIso(game.gameDate, game.time) })
            .eq("id", existingGame.id).is("starts_at", null);
        if (error) console.error("Unable to fill scheduled kickoff:", error);
    }

    // Bring schedule rows seeded by the previous full-name format in line with
    // the abbreviated historical matchup format.
    await Promise.all(PRIME_TIME_GAMES_2026.map(async game => {
        const legacy = scheduledDates.get(`${game.gameDate}|${game.title}`);
        if (!legacy) return;

        const { error } = await supabase
            .from("parlays")
            .update({
                title: abbreviateMatchup(game.title),
                notes: `${game.window} * WEEK ${game.week}`,
                primetime_type: getPrimetimeType(game.gameDate, "regular")
            })
            .eq("id", legacy.id);

        if (error) console.error("Unable to abbreviate a scheduled matchup:", error);
    }));

    const existingGames = new Set(
        (existing ?? []).flatMap(game => {
            const matchingScheduleGame = PRIME_TIME_GAMES_2026.find(item =>
                item.gameDate === game.game_date && item.title === game.title
            );
            return matchingScheduleGame
                ? [`${game.game_date}|${abbreviateMatchup(game.title)}`]
                : [`${game.game_date}|${game.title}`];
        })
    );
    const dismissedGames = new Set(
        (dismissedResult.data ?? []).map(game => `${game.game_date}|${game.title}`)
    );
    const missingGames = PRIME_TIME_GAMES_2026
        .filter(game => {
            const key = `${game.gameDate}|${abbreviateMatchup(game.title)}`;
            return !existingGames.has(key) && !dismissedGames.has(key);
        })
        .map(game => ({
            title: abbreviateMatchup(game.title),
            game_date: game.gameDate,
            starts_at: scheduledKickoffToIso(game.gameDate, game.time),
            status: "upcoming",
            result: null,
            total_odds: null,
            notes: `${game.window} * WEEK ${game.week}`,
            created_by: user.id,
            season: 2026,
            week: game.week,
            stage: "regular",
            primetime_type: getPrimetimeType(game.gameDate, "regular")
        }));

    if (!missingGames.length) return;

    const { error: insertError } = await supabase
        .from("parlays")
        .insert(missingGames);

    if (insertError) {
        console.error("Unable to add the prime-time schedule:", insertError);
    }
}

export async function updateGameStartTime(formData: FormData) {
    const id = formData.get("id")?.toString();
    if (!id) throw new Error("Missing game id.");
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");
    const { data: game, error } = await supabase.from("parlays")
        .select("game_date, status").eq("id", id).single();
    if (error || !game) throw new Error("Game could not be loaded.");
    if (game.status === "complete") throw new Error("Completed games cannot be rescheduled.");
    const startsAt = easternKickoffToIso(game.game_date, formData.get("gameTime")?.toString() ?? "");
    const { data: updated, error: updateError } = await supabase.from("parlays")
        .update({ starts_at: startsAt }).eq("id", id).neq("status", "complete")
        .eq("game_date", game.game_date).select("id");
    if (updateError || !updated?.length) throw new Error("Start time could not be saved. Refresh and try again.");
    revalidatePath("/dashboard");
}
