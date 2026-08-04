"use server";

import { getSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function savePick(formData: FormData) {
    const supabase = await getSupabaseServerClient();

    const parlayId = formData.get("parlayId")?.toString();
    const selection = formData.get("selection")?.toString();
    const oddsString = formData.get("odds")?.toString();
    const requestedTargetUserId = formData.get("targetUserId")?.toString();
    const odds = Number(oddsString);
    const { data: parlay, error: parlayError } =
        await supabase
            .from("parlays")
            .select("status, created_by")
            .eq("id", parlayId)
            .single();


    if (parlayError) {
        throw parlayError;
    }
    if (parlay.status !== "open") {
        throw new Error("This game is locked");
    }
    if (!parlayId || !selection || !oddsString) {
        throw new Error("Missing pick information");
    }

    if (isNaN(odds)) {
        throw new Error("Odds must be a number");
    }

    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("User not authenticated");
    }

    const targetUserId = requestedTargetUserId || user.id;

    if (targetUserId !== user.id && parlay.created_by !== user.id) {
        throw new Error("Only the game creator can manage other users' picks");
    }
    
    // Check if this user already has a pick for this parlay
    const { data: existingPick, error: existingError } = await supabase
        .from("picks")
        .select("id")
        .eq("parlay_id", parlayId)
        .eq("user_id", targetUserId)
        .maybeSingle();

    console.log("========== PICK DEBUG ==========");
    console.log("Current User:", user.id);
    console.log("Parlay ID:", parlayId);
    console.log("Existing Pick:", existingPick);
    console.log("Lookup Error:", existingError);
    console.log("===============================");

    if (existingError) {
        console.log(existingError);
        throw existingError;
    }

    if (existingPick) {
        // Update existing pick
        const { error } = await supabase
            .from("picks")
            .update({
                selection,
                odds
            })
            .eq("id", existingPick.id);

        if (error) {
            console.log(error);
            throw error;
        }
    } else {
        // Create new pick
        const { error } = await supabase
            .from("picks")
            .insert({
                parlay_id: parlayId,
                user_id: targetUserId,
                selection,
                odds
            });

        if (error) {
            console.log(error);
            throw error;
        }
    }

    // Refresh the dashboard so the updated pick appears immediately
    revalidatePath("/dashboard");
}
