import { easternDateTime, easternKickoffToIso } from "./game-time";

export type ReminderKind = "morning" | "kickoff";
export type ReminderGame = {
    id: string;
    title: string;
    game_date: string;
    starts_at: string | null;
    status: string;
    picks: Array<{ user_id: string; is_locked: boolean | null }>;
};
export const REMINDER_WINDOW_MS = 15 * 60_000;

export function dueReminders(game: ReminderGame, now: Date): Array<{ kind: ReminderKind; dueAt: string }> {
    if (!game.starts_at || !["upcoming", "open"].includes(game.status)) return [];
    const kickoff = new Date(game.starts_at).getTime();
    if (!Number.isFinite(kickoff) || kickoff <= now.getTime()) return [];
    const date = easternDateTime(game.starts_at).date;
    const morning = new Date(easternKickoffToIso(date, "08:00")).getTime();
    const beforeKickoff = kickoff - 2 * 60 * 60_000;
    // At a 10 a.m. kickoff both reminders coincide; send one kickoff reminder.
    return [
        ...(morning !== beforeKickoff ? [{ kind: "morning" as const, time: morning }] : []),
        { kind: "kickoff" as const, time: beforeKickoff }
    ].filter(slot => slot.time < kickoff && now.getTime() >= slot.time && now.getTime() < slot.time + REMINDER_WINDOW_MS)
        .map(slot => ({ kind: slot.kind, dueAt: new Date(slot.time).toISOString() }));
}

export function needsPickReminder(game: ReminderGame, userId: string) {
    return !game.picks.some(pick => pick.user_id === userId && pick.is_locked === true);
}
