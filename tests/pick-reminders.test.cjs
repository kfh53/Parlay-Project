const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadTs } = require("./load-ts.cjs");
const { runPickReminders } = loadTs("lib/pick-reminders.ts");
const ownerEmail = "kyle.f.harris53@gmail.com";

function fixture() {
    const game = { id: "game", title: "Test game", game_date: "2026-09-07", starts_at: "2026-09-08T00:15:00Z", status: "open",
        picks: [{ user_id: "locked", is_locked: true }, { user_id: "draft", is_locked: false }] };
    const ledger = new Map(), sends = [], finishes = [];
    const store = {
        games: async () => [game], users: async () => ["locked", "draft", "missing"],
        email: async id => id === "draft" ? ownerEmail : id + "@example.com",
        claim: async (candidate, payload) => {
            const key = candidate.userId;
            if (ledger.has(key)) return null;
            const claim = { id: key, lease_token: "lease", payload };
            ledger.set(key, claim);
            return claim;
        },
        currentGame: async () => game,
        finish: async (claim, status, detail) => { finishes.push({ id: claim.id, status, detail }); }
    };
    const options = { store, send: async (payload, key) => { sends.push({ payload, key }); return "provider-id"; },
        from: "test@example.com", appUrl: "https://example.com", dryRun: false,
        now: () => new Date("2026-09-07T12:00:00Z") };
    return { game, ledger, sends, finishes, store, options };
}
test("sends to all participants with missing or unlocked picks", async () => {
    const f = fixture();
    const summary = await runPickReminders(f.options);
    assert.equal(summary.sent, 2);
    assert.deepEqual([...f.ledger.keys()], ["draft", "missing"]);
    assert.deepEqual(f.sends.map(s => s.payload.to), [[ownerEmail], ["missing@example.com"]]);
    assert.match(f.sends[0].payload.text, /8:15 PM EDT/);
    assert.match(f.sends[0].payload.text, /https:\/\/example.com\/dashboard/);
    assert.equal(f.finishes.filter(item => item.status === "sent").length, 2);
});
test("repeat and overlapping runs respect claimed deliveries", async () => {
    const f = fixture();
    await Promise.all([runPickReminders(f.options), runPickReminders(f.options)]);
    await runPickReminders(f.options);
    assert.equal(f.sends.length, 2);
});
test("dry run neither claims deliveries nor looks up emails nor sends", async () => {
    const f = fixture();
    f.store.email = async () => { throw new Error("Dry run must not look up email"); };
    const summary = await runPickReminders({ ...f.options, dryRun: true });
    assert.equal(summary.due, 2);
    assert.equal(f.ledger.size, 0);
    assert.equal(f.sends.length, 0);
});
test("lock, closure, reschedule, or deletion after claim suppresses delivery", async () => {
    for (const current of [null, { status: "locked" }, { starts_at: "2026-09-08T01:15:00Z" },
        { picks: [{ user_id: "draft", is_locked: true }, { user_id: "missing", is_locked: true }] }]) {
        const f = fixture();
        f.store.currentGame = async () => current === null ? null : { ...f.game, ...current };
        await runPickReminders(f.options);
        assert.equal(f.sends.length, 0);
        assert.equal(f.finishes.every(item => item.status === "skipped"), true);
    }
});
test("retry uses the stored payload and stable provider key", async () => {
    const f = fixture();
    f.store.users = async () => ["draft"];
    const payload = { from: "original@example.com", to: [ownerEmail], subject: "Original subject", text: "Original body" };
    f.store.claim = async () => ({ id: "stable-id", lease_token: "new-lease", payload });
    await runPickReminders(f.options);
    await runPickReminders(f.options);
    assert.deepEqual(f.sends, [{ payload, key: "pick-reminder/stable-id" }, { payload, key: "pick-reminder/stable-id" }]);
});
test("provider failures are recorded while other participants still receive emails", async t => {
    t.mock.method(console, "error", () => {});
    const f = fixture();
    f.options.send = async payload => { if (payload.to[0] === ownerEmail) throw new Error("503"); return "ok"; };
    const result = await runPickReminders(f.options);
    assert.equal(result.failed, 1);
    assert.equal(result.sent, 1);
    assert.deepEqual(f.finishes.map(item => item.status), ["failed", "sent"]);
});
test("failed claims never send, and work is bounded per invocation", async t => {
    t.mock.method(console, "error", () => {});
    const f = fixture();
    f.store.claim = async () => { throw new Error("Database unavailable"); };
    assert.equal((await runPickReminders(f.options)).failed, 2);
    assert.equal(f.sends.length, 0);
    const limited = fixture();
    const result = await runPickReminders({ ...limited.options, maxAttempts: 1 });
    assert.equal(result.sent, 1);
    assert.equal(result.deferred, 1);
});

test("owner with a missing pick qualifies; a locked owner never receives reminders", async () => {
    const f = fixture();
    f.store.email = async id => id === "missing" ? ownerEmail.toUpperCase() : id + "@example.com";
    assert.equal((await runPickReminders(f.options)).sent, 2);
    assert.deepEqual([...f.ledger.keys()], ["draft", "missing"]);
    const locked = fixture();
    locked.store.email = async id => id === "locked" ? ownerEmail : id + "@example.com";
    assert.equal((await runPickReminders(locked.options)).sent, 2);
    assert.equal(locked.ledger.has("locked"), false);
});
test("stored retry payloads cannot send to multiple recipients or use cc/bcc", async () => {
    for (const addresses of [
        { to: [ownerEmail, "someone@example.com"] },
        { to: [ownerEmail], cc: ["someone@example.com"] },
        { to: [ownerEmail], bcc: ["someone@example.com"] }
    ]) {
        const f = fixture();
        f.store.claim = async () => ({
            id: "old", lease_token: "lease",
            payload: { from: "test@example.com", subject: "Old reminder", text: "Old body", ...addresses }
        });
        const result = await runPickReminders(f.options);
        assert.equal(result.sent, 0);
        assert.equal(f.sends.length, 0);
        assert.equal(f.finishes[0].status, "skipped");
    }
});
