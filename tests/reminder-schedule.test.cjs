const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadTs } = require("./load-ts.cjs");
const { easternKickoffToIso: iso, scheduledKickoffToIso, easternDateTime } = loadTs("lib/game-time.ts");
const { dueReminders, needsPickReminder } = loadTs("lib/reminder-schedule.ts");
const game = (date = "2026-09-07", time = "20:15") => ({
    id: "game", title: "Test game", game_date: date, starts_at: iso(date, time), status: "open", picks: []
});
const due = (g, instant) => dueReminders(g, new Date(instant)).map(slot => slot.kind);

test("Eastern kickoff conversion follows summer and winter offsets", () => {
    assert.equal(iso("2026-09-07", "20:15"), "2026-09-08T00:15:00.000Z");
    assert.equal(iso("2026-12-07", "20:15"), "2026-12-08T01:15:00.000Z");
    assert.deepEqual(easternDateTime(iso("2026-09-07", "00:00")), { date: "2026-09-07", time: "00:00" });
});
test("invalid dates and ambiguous or missing DST times are rejected", () => {
    for (const [date, time] of [["2026-02-30", "12:00"], ["bad", "12:00"], ["2026-09-07", "24:00"],
        ["2026-03-08", "02:30"], ["2026-11-01", "01:30"]]) assert.throws(() => iso(date, time));
});
test("8 a.m. remains New York local time across DST changes", () => {
    for (const [date, utc] of [["2026-03-08", "12:00"], ["2026-11-01", "13:00"]]) {
        assert.deepEqual(due(game(date), date + "T" + utc + ":00Z"), ["morning"]);
    }
    assert.deepEqual(due(game(), "2026-09-07T11:59:59Z"), []);
    assert.deepEqual(due(game(), "2026-09-07T12:00:00Z"), ["morning"]);
    assert.deepEqual(due(game("2026-12-07"), "2026-12-07T12:00:00Z"), []);
    assert.deepEqual(due(game("2026-12-07"), "2026-12-07T13:00:00Z"), ["morning"]);
});
test("two-hour reminder and bounded retries never run after kickoff", () => {
    assert.deepEqual(due(game(), "2026-09-07T22:14:59Z"), []);
    assert.deepEqual(due(game(), "2026-09-07T22:15:00Z"), ["kickoff"]);
    assert.deepEqual(due(game(), "2026-09-07T22:29:59Z"), ["kickoff"]);
    assert.deepEqual(due(game(), "2026-09-07T22:30:00Z"), []);
    assert.deepEqual(due(game(), "2026-09-08T00:15:00Z"), []);
});
test("early kickoffs, midnight crossings, and coincident reminders", () => {
    assert.deepEqual(due(game("2026-09-07", "07:00"), "2026-09-07T12:00:00Z"), []);
    assert.deepEqual(due(game("2026-09-07", "10:00"), "2026-09-07T12:00:00Z"), ["kickoff"]);
    assert.deepEqual(due(game("2026-09-08", "00:30"), "2026-09-08T02:30:00Z"), ["kickoff"]);
});
test("missing times and closed games are skipped; missing or unlocked picks qualify", () => {
    for (const status of ["locked", "complete"]) assert.deepEqual(due({ ...game(), status }, "2026-09-07T12:00:00Z"), []);
    assert.deepEqual(due({ ...game(), starts_at: null }, "2026-09-07T12:00:00Z"), []);
    assert.deepEqual(due({ ...game(), status: "upcoming" }, "2026-09-07T12:00:00Z"), ["morning"]);
    assert.equal(needsPickReminder(game(), "u1"), true);
    assert.equal(needsPickReminder({ ...game(), picks: [{ user_id: "u1", is_locked: false }] }, "u1"), true);
    assert.equal(needsPickReminder({ ...game(), picks: [{ user_id: "u1", is_locked: true }] }, "u1"), false);
});
test("all bundled schedule times convert and round-trip to the game date", () => {
    const { PRIME_TIME_GAMES_2026 } = loadTs("lib/prime-time-schedule.ts");
    for (const row of PRIME_TIME_GAMES_2026) assert.equal(easternDateTime(scheduledKickoffToIso(row.gameDate, row.time)).date, row.gameDate);
    assert.equal(scheduledKickoffToIso("2026-09-07", "12:00 AM ET"), iso("2026-09-07", "00:00"));
    assert.equal(scheduledKickoffToIso("2026-09-07", "12:00 PM ET"), iso("2026-09-07", "12:00"));
});
