"use server";

import { getSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import {
    betTypeNeedsPlayer,
    betTypeNeedsTeam,
    isBetType,
    matchupTeams
} from "@/lib/pick-fields";
import { sendGameLockedEmails } from "@/lib/game-lock-email";

export type SavePickResult = { error?: string; success?: true };

export async function savePick(formData: FormData) {
    const parlayId = formData.get("parlayId")?.toString();
    const selection = formData.get("selection")?.toString().trim();
    const oddsString = formData.get("odds")?.toString();
    const betTypeValue = formData.get("betType")?.toString().trim() ?? "";
    const playerNameValue = formData.get("playerName")?.toString().trim() ?? "";
    const teamNameValue = formData.get("teamName")?.toString().trim().toUpperCase() ?? "";
    const requestedTargetUserId = formData.get("targetUserId")?.toString();
    const odds = Number.parseInt(oddsString ?? "", 10);

    if (!parlayId || !selection || !oddsString) {
        return { error: "Enter a pick and its odds." } satisfies SavePickResult;
    }

    if (!Number.isInteger(odds)) {
        return { error: "Odds must be a whole number." } satisfies SavePickResult;
    }

    if (!isBetType(betTypeValue)) {
        return { error: "Select a valid type of bet." } satisfies SavePickResult;
    }

    if (betTypeNeedsPlayer(betTypeValue) && !playerNameValue) {
        return { error: "Enter the player this pick is about." } satisfies SavePickResult;
    }

    if (betTypeNeedsTeam(betTypeValue) && !teamNameValue) {
        return { error: "Select the team this pick is about." } satisfies SavePickResult;
    }

    if (selection.length > 250 || playerNameValue.length > 100 || teamNameValue.length > 10) {
        return { error: "One or more pick details are too long." } satisfies SavePickResult;
    }

    const supabase = await getSupabaseServerClient();
    const { data: parlay, error: parlayError } =
        await supabase
            .from("parlays")
            .select("status, created_by, title")
            .eq("id", parlayId)
            .single();


    if (parlayError) {
        console.error("Error finding parlay:", parlayError);
        return { error: "Unable to find this parlay. Refresh the page and try again." } satisfies SavePickResult;
    }
    if (parlay.status !== "open") {
        return { error: "This game is locked." } satisfies SavePickResult;
    }

    const teams = matchupTeams(parlay.title ?? "");
    if (teamNameValue && teams.length && !teams.includes(teamNameValue)) {
        return { error: "Select one of the teams playing in this game." } satisfies SavePickResult;
    }

    const pickDetails = {
        selection,
        odds,
        bet_type: betTypeValue,
        player_name: betTypeNeedsPlayer(betTypeValue) ? playerNameValue : null,
        team_name: betTypeNeedsTeam(betTypeValue) ? teamNameValue : null
    };

    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Your session has expired. Please sign in again." } satisfies SavePickResult;
    }

    const targetUserId = requestedTargetUserId || user.id;

    if (targetUserId !== user.id && parlay.created_by !== user.id) {
        return { error: "Only the game creator can manage other users' picks." } satisfies SavePickResult;
    }
    
    // Check if this user already has a pick for this parlay
    const { data: existingPick, error: existingError } = await supabase
        .from("picks")
        .select("id, is_locked")
        .eq("parlay_id", parlayId)
        .eq("user_id", targetUserId)
        .maybeSingle();

    if (existingError) {
        console.error("Error finding existing pick:", existingError);
        return { error: "Unable to check your existing pick. Please try again." } satisfies SavePickResult;
    }

    if (existingPick?.is_locked) {
        return { error: "This pick has been locked and can no longer be edited." } satisfies SavePickResult;
    }

    if (existingPick) {
        // Update existing pick
        const { error } = await supabase
            .from("picks")
            .update(pickDetails)
            .eq("id", existingPick.id);

        if (error) {
            console.error("Error updating pick:", error);
            return { error: "Unable to update this pick. Please try again." } satisfies SavePickResult;
        }
    } else {
        // Create new pick
        const { error } = await supabase
            .from("picks")
            .insert({
                parlay_id: parlayId,
                user_id: targetUserId,
                ...pickDetails,
                // A pending pick has no result yet. Explicitly use NULL instead of
                // the database default, which does not satisfy picks_result_check.
                result: null
            });

        if (error) {
            console.error("Error creating pick:", error);
            return { error: "Unable to save this pick. Please try again." } satisfies SavePickResult;
        }
    }

    // Refresh the dashboard so the updated pick appears immediately
    revalidatePath("/dashboard");
    return { success: true } satisfies SavePickResult;
}

export async function lockPick(formData: FormData) {
    const pickId = formData.get("pickId")?.toString();
    if (!pickId) throw new Error("Missing pick id");

    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data: pick, error: pickError } = await supabase
        .from("picks")
        .select("id, parlay_id, user_id, is_locked, parlays!inner(status, created_by)")
        .eq("id", pickId)
        .single();

    if (pickError) throw pickError;
    const parlay = Array.isArray(pick.parlays) ? pick.parlays[0] : pick.parlays;
    const canLockPick = pick.user_id === user.id || parlay?.created_by === user.id;
    if (!canLockPick) throw new Error("You do not have permission to lock this pick");
    if (pick.is_locked) return;
    if (parlay?.status !== "open") throw new Error("This game is not accepting picks");

    const { error: lockError } = await supabase
        .from("picks")
        .update({ is_locked: true })
        .eq("id", pickId);

    if (lockError) throw lockError;

    const [{ data: profiles, error: profilesError }, { data: picks, error: picksError }] = await Promise.all([
        supabase.from("profiles").select("id"),
        supabase.from("picks").select("user_id, is_locked").eq("parlay_id", pick.parlay_id)
    ]);

    if (profilesError) throw profilesError;
    if (picksError) throw picksError;

    const lockedUserIds = new Set(
        (picks ?? []).filter(item => item.is_locked).map(item => item.user_id)
    );
    const everyPickIsLocked = Boolean(profiles?.length) &&
        profiles.every(profile => lockedUserIds.has(profile.id));

    if (everyPickIsLocked) {
        const { data: lockedGame, error: gameLockError } = await supabase
            .from("parlays")
            .update({ status: "locked" })
            .eq("id", pick.parlay_id)
            .eq("status", "open")
            .select("id")
            .maybeSingle();

        if (gameLockError) throw gameLockError;

        if (lockedGame) {
            try {
                await sendGameLockedEmails(pick.parlay_id);
            } catch (emailError) {
                // A notification outage should never undo a successfully locked game.
                console.error("Game locked, but notification email failed:", emailError);
            }
        }
    }

    revalidatePath("/dashboard");
}
