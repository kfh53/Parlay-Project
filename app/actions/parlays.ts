"use server";

import { getSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function deleteGame(formData: FormData) {
    const id = formData.get("id")?.toString();
    if (!id) throw new Error("Missing game id");

    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data: game, error: gameError } = await supabase
        .from("parlays")
        .select("title, game_date")
        .eq("id", id)
        .single();

    if (gameError) throw gameError;

    const { error: dismissalError } = await supabase
        .from("dismissed_games")
        .upsert({
            title: game.title,
            game_date: game.game_date,
            dismissed_by: user.id,
            dismissed_at: new Date().toISOString()
        });

    if (dismissalError) throw dismissalError;

    const { error } = await supabase
        .from("parlays")
        .delete()
        .eq("id", id);

    if (error) throw error;
    revalidatePath("/dashboard");
}

export async function promoteGame(formData: FormData) {
    const id = formData.get("id")?.toString();
    if (!id) throw new Error("Missing game id");

    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
        .from("parlays")
        .update({ status: "open" })
        .eq("id", id)
        .eq("status", "upcoming");

    if (error) throw error;
    revalidatePath("/dashboard");
}

export async function lockGame(
    formData: FormData
){

    const supabase =
        await getSupabaseServerClient();


    const id =
        formData.get("id")?.toString();


    if(!id){
        throw new Error("Missing game id");
    }


    const {error} =
        await supabase
            .from("parlays")
            .update({
                status:"locked"
            })
            .eq(
                "id",
                id
            );


    if(error){
        throw error;
    }


    revalidatePath("/dashboard");
}

export async function completeGame(
    formData: FormData
) {

    const supabase = await getSupabaseServerClient();
    const id = formData.get("id")?.toString();

    if (!id) {
        throw new Error("Missing game id");
    }

    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("User not authenticated");
    }

    const { data: parlay, error: parlayError } = await supabase
        .from("parlays")
        .select("status, created_by, total_odds")
        .eq("id", id)
        .single();

    if (parlayError) {
        throw parlayError;
    }

    if (parlay.status !== "locked") {
        throw new Error("Only locked games can be completed");
    }

    if (parlay.created_by !== user.id) {
        throw new Error("Only the game creator can complete this game");
    }

    if (parlay.total_odds === null) {
        throw new Error("Enter total odds before completing the game");
    }

    const { data: picks, error: picksError } = await supabase
        .from("picks")
        .select("id, result")
        .eq("parlay_id", id);

    if (picksError) {
        throw picksError;
    }

    if (!picks?.length || picks.some(pick => !pick.result)) {
        throw new Error("Enter a result for every pick before completing the game");
    }

    const result = picks.some(pick => pick.result === "loss")
        ? "loss"
        : picks.some(pick => pick.result === "win")
            ? "win"
            : "push";

    const losingPicks = picks.filter(pick => pick.result === "loss");
    const killerPickId = losingPicks.length === 1 ? losingPicks[0].id : null;

    // Recalculate every flag so correcting results before completion cannot
    // leave a stale parlay killer on another pick.
    const killerUpdates = await Promise.all(
        picks.map(pick =>
            supabase
                .from("picks")
                .update({ parlay_killer: pick.id === killerPickId })
                .eq("id", pick.id)
        )
    );

    const killerUpdateError = killerUpdates.find(update => update.error)?.error;
    if (killerUpdateError) {
        throw killerUpdateError;
    }

    const { error } = await supabase
        .from("parlays")
        .update({ status: "complete", result })
        .eq("id", id);

    if (error) {
        throw error;
    }

    revalidatePath("/dashboard");
}

export async function updateParlayTotalOdds(formData: FormData) {
    const id = formData.get("id")?.toString();
    const totalOddsValue = formData.get("totalOdds")?.toString();
    const totalOdds = Number.parseInt(totalOddsValue ?? "", 10);

    if (!id || !Number.isInteger(totalOdds)) {
        throw new Error("Enter total odds as a whole number");
    }

    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data: parlay, error: parlayError } = await supabase
        .from("parlays")
        .select("status, created_by")
        .eq("id", id)
        .single();

    if (parlayError) throw parlayError;
    if (parlay.status !== "locked" || parlay.created_by !== user.id) {
        throw new Error("Only the creator can set total odds for a locked game");
    }

    const { error } = await supabase
        .from("parlays")
        .update({ total_odds: totalOdds })
        .eq("id", id);

    if (error) throw error;
    revalidatePath("/dashboard");
}
