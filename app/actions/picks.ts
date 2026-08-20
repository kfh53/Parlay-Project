"use server";

import { getSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import {
    betTypeNeedsPlayer,
    betTypeNeedsTeam,
    isBetType,
    matchupTeams
} from "@/lib/pick-fields";

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
        .select("id")
        .eq("parlay_id", parlayId)
        .eq("user_id", targetUserId)
        .maybeSingle();

    if (existingError) {
        console.error("Error finding existing pick:", existingError);
        return { error: "Unable to check your existing pick. Please try again." } satisfies SavePickResult;
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
