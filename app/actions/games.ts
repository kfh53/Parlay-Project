"use server";

import { getSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";


export async function createGame(formData: FormData) {

    const supabase =
        await getSupabaseServerClient();


    const title =
        formData.get("title")?.toString();


    const gameDate =
        formData.get("gameDate")?.toString();


    if (!title || !gameDate) {
        throw new Error(
            "Game title and date are required."
        );
    }


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
                created_by: user.id
            });


    if (error) {
        console.log(error);
        throw error;
    }


    revalidatePath("/dashboard");
}