import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase-admin";

// Temporary delivery restriction while locked-game notifications are tested.
const ALLOWED_TEST_RECIPIENT = "kyle.f.harris53@gmail.com";

type LockedPick = {
    id: string;
    user_id: string;
    selection: string;
    odds: number;
    player_name: string | null;
    bet_type: string | null;
    team_name: string | null;
    profiles: { display_name: string } | { display_name: string }[] | null;
};

function escapeHtml(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function profileName(pick: LockedPick) {
    const profile = Array.isArray(pick.profiles) ? pick.profiles[0] : pick.profiles;
    return profile?.display_name ?? "Player";
}

function formattedOdds(odds: number) {
    return `${odds > 0 ? "+" : ""}${odds}`;
}

export async function sendGameLockedEmails(parlayId: string) {
    const resendApiKey = process.env.RESEND_API_KEY;
    const emailFrom = process.env.EMAIL_FROM;

    if (!resendApiKey || !emailFrom) {
        console.warn("Game locked, but RESEND_API_KEY or EMAIL_FROM is not configured.");
        return;
    }

    const supabase = getSupabaseAdminClient();
    const { data: game, error: gameError } = await supabase
        .from("parlays")
        .select(`
            id,
            title,
            game_date,
            notes,
            week,
            status,
            picks (
                id,
                user_id,
                selection,
                odds,
                player_name,
                bet_type,
                team_name,
                profiles (display_name)
            )
        `)
        .eq("id", parlayId)
        .single();

    if (gameError || !game || game.status !== "locked") {
        throw gameError ?? new Error("Locked game could not be loaded for email");
    }

    const picks = (game.picks ?? []) as LockedPick[];
    const pickText = picks
        .map(pick => `${profileName(pick)}: ${pick.selection} (${formattedOdds(pick.odds)})`)
        .join("\n");
    const pickHtml = picks
        .map(pick => `
            <tr>
                <td style="padding:10px 12px;border-bottom:1px solid #334155;color:#cbd5e1;">${escapeHtml(profileName(pick))}</td>
                <td style="padding:10px 12px;border-bottom:1px solid #334155;color:#f1f5f9;">${escapeHtml(pick.selection)}</td>
                <td style="padding:10px 12px;border-bottom:1px solid #334155;color:#93c5fd;text-align:right;">${formattedOdds(pick.odds)}</td>
            </tr>
        `)
        .join("");

    await Promise.all(picks.map(async pick => {
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(pick.user_id);
        const email = authUser.user?.email;

        if (authError || !email) {
            console.error(`Unable to find an email address for user ${pick.user_id}:`, authError);
            return;
        }

        if (email.toLowerCase() !== ALLOWED_TEST_RECIPIENT) return;

        const { data: existingNotification } = await supabase
            .from("game_notifications")
            .select("status")
            .eq("parlay_id", parlayId)
            .eq("recipient_user_id", pick.user_id)
            .eq("notification_type", "game_locked")
            .maybeSingle();

        if (existingNotification?.status === "sent") return;

        await supabase.from("game_notifications").upsert({
            parlay_id: parlayId,
            recipient_user_id: pick.user_id,
            notification_type: "game_locked",
            status: "sending",
            error_message: null
        });

        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
                "Idempotency-Key": `game-locked/${parlayId}/${pick.user_id}`
            },
            body: JSON.stringify({
                from: emailFrom,
                to: [email],
                subject: `${game.title} is locked`,
                text: `${game.title} is officially locked.\n\nDate: ${game.game_date}\n${game.notes ? `Details: ${game.notes}\n` : ""}${game.week ? `Week: ${game.week}\n` : ""}\nLocked picks:\n${pickText}`,
                html: `
                    <div style="background:#0f172a;color:#e2e8f0;font-family:Arial,sans-serif;padding:28px;">
                        <div style="max-width:620px;margin:0 auto;background:#111827;border:1px solid #334155;border-radius:12px;padding:24px;">
                            <p style="margin:0 0 8px;color:#60a5fa;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Game locked</p>
                            <h1 style="margin:0;color:#f8fafc;font-size:24px;">${escapeHtml(game.title)}</h1>
                            <p style="margin:8px 0 0;color:#94a3b8;">${escapeHtml(game.game_date)}${game.notes ? ` &middot; ${escapeHtml(game.notes)}` : ""}</p>
                            <table style="width:100%;margin-top:24px;border-collapse:collapse;background:#0f172a;border-radius:8px;overflow:hidden;">
                                <thead><tr><th style="padding:10px 12px;text-align:left;color:#94a3b8;">Player</th><th style="padding:10px 12px;text-align:left;color:#94a3b8;">Pick</th><th style="padding:10px 12px;text-align:right;color:#94a3b8;">Odds</th></tr></thead>
                                <tbody>${pickHtml}</tbody>
                            </table>
                            <p style="margin:20px 0 0;color:#94a3b8;font-size:13px;">All participant picks are locked and can no longer be edited.</p>
                        </div>
                    </div>
                `
            })
        });

        const responseBody = await response.json().catch(() => ({})) as { id?: string; message?: string };
        await supabase.from("game_notifications").upsert({
            parlay_id: parlayId,
            recipient_user_id: pick.user_id,
            notification_type: "game_locked",
            status: response.ok ? "sent" : "failed",
            provider_message_id: responseBody.id ?? null,
            error_message: response.ok ? null : responseBody.message ?? `Email provider returned ${response.status}`,
            sent_at: response.ok ? new Date().toISOString() : null
        });

        if (!response.ok) throw new Error(responseBody.message ?? `Email provider returned ${response.status}`);
    }));
}
