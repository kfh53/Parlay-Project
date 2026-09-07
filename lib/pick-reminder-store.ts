import "server-only";
import { randomUUID } from "node:crypto";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { ReminderStore, ReminderClaim } from "./pick-reminders";
import type { ReminderGame } from "./reminder-schedule";

const gameFields = "id, title, game_date, starts_at, status, picks(user_id, is_locked)";

export function createReminderStore(): ReminderStore {
    const db = getSupabaseAdminClient();
    return {
        async games(now) {
            const { data, error } = await db.from("parlays").select(gameFields)
                .in("status", ["upcoming", "open"]).gt("starts_at", now.toISOString())
                .lte("starts_at", new Date(now.getTime() + 26 * 60 * 60_000).toISOString())
                .order("starts_at");
            if (error) throw error;
            return (data ?? []) as ReminderGame[];
        },
        async users() {
            const { data, error } = await db.from("profiles").select("id").order("id");
            if (error) throw error;
            return (data ?? []).map(user => user.id);
        },
        async email(userId) {
            const { data, error } = await db.auth.admin.getUserById(userId);
            if (error) throw error;
            return data.user?.email_confirmed_at ? data.user.email ?? null : null;
        },
        async claim(candidate, payload) {
            const { data, error } = await db.rpc("claim_pick_reminder", {
                p_parlay_id: candidate.game.id, p_user_id: candidate.userId,
                p_kind: candidate.kind, p_starts_at: candidate.game.starts_at,
                p_due_at: candidate.dueAt, p_payload: payload, p_token: randomUUID()
            });
            if (error) throw error;
            return (data?.[0] ?? null) as ReminderClaim | null;
        },
        async currentGame(id) {
            const { data, error } = await db.from("parlays").select(gameFields).eq("id", id).maybeSingle();
            if (error) throw error;
            return data as ReminderGame | null;
        },
        async finish(claim, status, detail) {
            const { data, error } = await db.from("pick_reminders").update({
                status,
                provider_message_id: status === "sent" ? detail : null,
                error_message: status === "failed" ? detail : null,
                sent_at: status === "sent" ? new Date().toISOString() : null,
                updated_at: new Date().toISOString()
            }).eq("id", claim.id).eq("lease_token", claim.lease_token).eq("status", "sending").select("id");
            if (error) throw error;
            if (!data?.length) throw new Error("Reminder lease no longer owned.");
        }
    };
}
