import { dueReminders, needsPickReminder, type ReminderGame, type ReminderKind } from "./reminder-schedule";
import { formatKickoff } from "./game-time";
import { isAllowedNotificationRecipient, isAllowedNotificationPayload } from "./notification-recipient";

export type EmailPayload = { from: string; to: string[]; subject: string; text: string };
export type ReminderClaim = { id: string; lease_token: string; payload: EmailPayload };
export type ReminderCandidate = { game: ReminderGame; userId: string; kind: ReminderKind; dueAt: string };
export type ReminderStore = {
    games(now: Date): Promise<ReminderGame[]>;
    users(): Promise<string[]>;
    email(userId: string): Promise<string | null>;
    claim(candidate: ReminderCandidate, payload: EmailPayload): Promise<ReminderClaim | null>;
    currentGame(id: string): Promise<ReminderGame | null>;
    finish(claim: ReminderClaim, status: "sent" | "failed" | "skipped", detail?: string): Promise<void>;
};

export async function runPickReminders(options: {
    store: ReminderStore;
    send: (payload: EmailPayload, key: string) => Promise<string>;
    from: string;
    appUrl: string;
    dryRun: boolean;
    now?: () => Date;
    maxAttempts?: number;
}) {
    const { store, send, from, dryRun } = options;
    const clock = options.now ?? (() => new Date());
    const started = clock().getTime();
    const summary = { dryRun, due: 0, sent: 0, skipped: 0, failed: 0, deferred: 0 };
    const games = await store.games(clock());
    const dueGames = games.map(game => ({ game, slots: dueReminders(game, clock()) })).filter(item => item.slots.length);
    if (!dueGames.length) return summary;
    const users = await store.users();
    const emails = new Map<string, string | null>();
    let attempts = 0;

    for (const { game, slots } of dueGames) {
        for (const slot of slots) {
            for (const userId of users) {
                if (!needsPickReminder(game, userId)) continue;
                summary.due++;
                if (dryRun) continue;
                if (attempts >= (options.maxAttempts ?? 20) || clock().getTime() - started >= 40_000) {
                    summary.deferred++;
                    continue;
                }
                let claim: ReminderClaim | null = null;
                try {
                    if (!emails.has(userId)) emails.set(userId, await store.email(userId));
                    const email = emails.get(userId);
                    if (!email || !isAllowedNotificationRecipient(email)) { summary.skipped++; continue; }
                    const payload: EmailPayload = {
                        from, to: [email],
                        subject: `Lock your pick: ${game.title}`,
                        text: `${slot.kind === "morning" ? "Game-day reminder" : "Kickoff reminder"}: your pick for ${game.title} has not been locked.\n\nKickoff: ${game.game_date} at ${formatKickoff(game.starts_at!)}.\n\n${game.status === "upcoming" ? "Move this game to Current Games, then add and lock your pick." : "Add your pick if needed, then lock it before kickoff."}\n\n${new URL("/dashboard", options.appUrl).href}`
                    };
                    claim = await store.claim({ game, userId, kind: slot.kind, dueAt: slot.dueAt }, payload);
                    if (!claim) { summary.skipped++; continue; }
                    attempts++;
                    // Re-read after claiming: a user may have locked while the job was preparing emails.
                    const current = await store.currentGame(game.id);
                    if (!current || new Date(current.starts_at ?? "").getTime() !== new Date(game.starts_at!).getTime()
                        || !needsPickReminder(current, userId)
                        || !dueReminders(current, clock()).some(item => item.kind === slot.kind)) {
                        await store.finish(claim, "skipped");
                        summary.skipped++;
                        continue;
                    }
                    // Retries may contain payloads saved before recipient restrictions changed.
                    if (!isAllowedNotificationPayload(claim.payload)) {
                        await store.finish(claim, "skipped");
                        summary.skipped++;
                        continue;
                    }
                    const providerId = await send(claim.payload, `pick-reminder/${claim.id}`);
                    await store.finish(claim, "sent", providerId);
                    summary.sent++;
                } catch (cause) {
                    summary.failed++;
                    console.error("Pick reminder failed", { gameId: game.id, userId, error: cause instanceof Error ? cause.message : "Unknown error" });
                    if (claim) {
                        try { await store.finish(claim, "failed", "Delivery failed; see server logs."); }
                        catch { console.error("Unable to record reminder failure", { reminderId: claim.id }); }
                    }
                }
            }
        }
    }
    return summary;
}
