"use server";

import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getFootballMetadata } from "@/lib/football-calendar";
import { PRIME_TIME_GAMES_2026 } from "@/lib/prime-time-schedule";
import { revalidatePath } from "next/cache";

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
                status: "open",
                result: null,
                total_odds: null,
                notes,
                created_by: user.id,
                season: season ?? footballMetadata.season,
                week: week ?? footballMetadata.week,
                stage: stage ?? footballMetadata.stage
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

    const { data: existing, error: selectError } = await supabase
        .from("parlays")
        .select("title, game_date")
        .eq("season", 2026);

    if (selectError) {
        console.error("Unable to check the prime-time schedule:", selectError);
        return;
    }

    const existingGames = new Set(
        (existing ?? []).map(game => `${game.game_date}|${game.title}`)
    );
    const missingGames = PRIME_TIME_GAMES_2026
        .filter(game => !existingGames.has(`${game.gameDate}|${game.title}`))
        .map(game => ({
            title: game.title,
            game_date: game.gameDate,
            status: "open",
            result: null,
            total_odds: null,
            notes: `${game.window} · ${game.time}`,
            created_by: user.id,
            season: 2026,
            week: game.week,
            stage: "regular"
        }));

    if (!missingGames.length) return;

    const { error: insertError } = await supabase
        .from("parlays")
        .insert(missingGames);

    if (insertError) {
        console.error("Unable to add the prime-time schedule:", insertError);
    }
}
