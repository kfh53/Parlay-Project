"use server";


import { getSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";


export async function updatePickResult(
    formData: FormData
) {

    const supabase =
        await getSupabaseServerClient();


    const pickId =
        formData.get("pickId")?.toString();


    const result =
        formData.get("result")?.toString();



    if (!pickId) {
        throw new Error(
            "Missing pick information"
        );
    }

    if (result && !["win", "loss", "push"].includes(result)) {
        throw new Error("Invalid result");
    }

    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("User not authenticated");
    }

    const { data: pick, error: pickError } = await supabase
        .from("picks")
        .select("parlay_id")
        .eq("id", pickId)
        .single();

    if (pickError) {
        throw pickError;
    }

    const { data: parlay, error: parlayError } = await supabase
        .from("parlays")
        .select("status, created_by")
        .eq("id", pick.parlay_id)
        .single();

    if (parlayError) {
        throw parlayError;
    }

    if (parlay.status !== "locked") {
        throw new Error("Results can only be entered for locked games");
    }

    if (parlay.created_by !== user.id) {
        throw new Error("Only the game creator can enter results");
    }


    const { error } =
        await supabase
            .from("picks")
            .update({
                result: result || null
            })
            .eq(
                "id",
                pickId
            );



    if (error) {
        console.log(error);
        throw error;
    }


    revalidatePath("/dashboard");
}
