"use server";


import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import { isValidAmericanOdds } from "@/lib/odds";

export type SaveGameResultsResult = { error?: string; success?: true };

export async function saveGameResults(formData: FormData) {
    const parlayId = formData.get("parlayId")?.toString();
    const totalOddsString = formData.get("totalOdds")?.toString().trim() ?? "";
    const totalOdds = Number(totalOddsString);

    if (!parlayId) return { error: "Missing game information." } satisfies SaveGameResultsResult;
    if (!/^[+-]?\d+$/.test(totalOddsString) || !Number.isSafeInteger(totalOdds)) {
        return { error: "Total odds must be a whole number, optionally starting with + or -." } satisfies SaveGameResultsResult;
    }
    if (totalOdds < -2147483648 || totalOdds > 2147483647) {
        return { error: "Total odds are outside the supported range." } satisfies SaveGameResultsResult;
    }
    if (!isValidAmericanOdds(totalOdds)) {
        return { error: "American odds must be -100 or lower, or +100 or higher." } satisfies SaveGameResultsResult;
    }

    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Your session has expired. Please sign in again." } satisfies SaveGameResultsResult;

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError || !profile) {
        return { error: "Only game participants can enter results." } satisfies SaveGameResultsResult;
    }

    const admin = getSupabaseAdminClient();
    const { data: parlay, error: parlayError } = await admin
        .from("parlays")
        .select("status")
        .eq("id", parlayId)
        .single();

    if (parlayError) return { error: "Unable to find this game." } satisfies SaveGameResultsResult;
    if (parlay.status !== "locked") return { error: "Results can only be entered for locked games." } satisfies SaveGameResultsResult;

    const { data: picks, error: picksError } = await admin
        .from("picks")
        .select("id")
        .eq("parlay_id", parlayId);

    if (picksError || !picks?.length) return { error: "Unable to load picks for this game." } satisfies SaveGameResultsResult;

    const results = picks.map(pick => ({
        id: pick.id,
        result: formData.get(`result-${pick.id}`)?.toString(),
        oddsString: formData.get(`odds-${pick.id}`)?.toString().trim() ?? "",
        odds: Number(formData.get(`odds-${pick.id}`)?.toString().trim() ?? "")
    }));

    if (results.some(item => !item.result || !["win", "loss", "push"].includes(item.result))) {
        return { error: "Select a result for every pick." } satisfies SaveGameResultsResult;
    }

    if (results.some(item => !/^[+-]?\d+$/.test(item.oddsString) || !Number.isSafeInteger(item.odds)
        || item.odds < -2147483648 || item.odds > 2147483647 || !isValidAmericanOdds(item.odds))) {
        return { error: "Enter valid American odds for every pick: a whole number of -100 or lower, or +100 or higher, within the supported range." } satisfies SaveGameResultsResult;
    }

    const pickUpdates = await Promise.all(results.map(item =>
        admin.from("picks").update({ result: item.result, odds: item.odds }).eq("id", item.id)
    ));
    const pickUpdateError = pickUpdates.find(update => update.error)?.error;
    if (pickUpdateError) return { error: "Unable to save every pick result and odds." } satisfies SaveGameResultsResult;

    const { error: oddsError } = await admin
        .from("parlays")
        .update({ total_odds: totalOdds })
        .eq("id", parlayId);

    if (oddsError) return { error: "Pick results were saved, but total odds could not be updated." } satisfies SaveGameResultsResult;

    revalidatePath("/dashboard");
    revalidatePath("/stats");
    return { success: true } satisfies SaveGameResultsResult;
}
