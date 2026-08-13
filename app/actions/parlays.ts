"use server";

import { getSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

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
        .select("status, created_by")
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

    const { data: picks, error: picksError } = await supabase
        .from("picks")
        .select("result")
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

    const { error } = await supabase
        .from("parlays")
        .update({ status: "complete", result })
        .eq("id", id);

    if (error) {
        throw error;
    }

    revalidatePath("/dashboard");
}
