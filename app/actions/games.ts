"use server";

import { getSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function createGame(formData: FormData) {
    const supabase = await getSupabaseServerClient();

    const title = formData.get("title")?.toString();
    const gameDate = formData.get("gameDate")?.toString();

    if (!title || !gameDate) {
        throw new Error("Game title and date are required.");
    }

    const { data, error } = await supabase
        .from("parlays")
        .insert({
            title,
            game_date: gameDate,
            status: "open",
        })
        .select();

    console.log("Insert Data:", data);
    console.log("Insert Error:", error);

    if (error) {
        throw error;
    }

    revalidatePath("/dashboard");
}