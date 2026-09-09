const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadTs } = require("./load-ts.cjs");

function fixture(status = "locked") {
    const writes = [], refreshed = [];
    const db = {
        auth: { getUser: async () => ({ data: { user: { id: "user" } } }) },
        from: table => ({
            select() { return this; },
            eq() { return this; },
            single: async () => ({ data: { status } }),
            maybeSingle: async () => ({ data: { id: "user" } }),
            then(resolve) { return Promise.resolve({ data: [{ id: "a" }, { id: "b" }] }).then(resolve); },
            update(values) {
                return { eq: async (column, id) => { writes.push({ table, id, values }); return { error: null }; } };
            }
        })
    };
    const { saveGameResults } = loadTs("app/actions/results.ts", {
        "@/lib/supabase-server": { getSupabaseServerClient: async () => db },
        "@/lib/supabase-admin": { getSupabaseAdminClient: () => db },
        "next/cache": { revalidatePath: path => refreshed.push(path) }
    });
    const form = new FormData();
    for (const [key, value] of Object.entries({ parlayId: "game", totalOdds: "500",
        "result-a": "win", "odds-a": "+150", "result-b": "push", "odds-b": "-120" })) form.set(key, value);
    return { saveGameResults, form, writes, refreshed };
}

test("result entry saves each leg's odds and refreshes statistics", async () => {
    const f = fixture();
    assert.deepEqual(await f.saveGameResults(f.form), { success: true });
    assert.deepEqual(f.writes, [
        { table: "picks", id: "a", values: { result: "win", odds: 150 } },
        { table: "picks", id: "b", values: { result: "push", odds: -120 } },
        { table: "parlays", id: "game", values: { total_odds: 500 } }
    ]);
    assert.deepEqual(f.refreshed, ["/dashboard", "/stats"]);
});

test("invalid or missing leg odds reject the entire submission before writing", async () => {
    for (const odds of [null, "", "99", "-99", "0", "150.5", "1e3", "abc", "2147483648", "-2147483649"]) {
        const f = fixture();
        if (odds === null) f.form.delete("odds-b");
        else f.form.set("odds-b", odds);
        assert.match((await f.saveGameResults(f.form)).error, /valid American odds/);
        assert.equal(f.writes.length, 0);
    }
});

test("leg odds updates still require a locked game and valid results", async () => {
    for (const status of ["open", "upcoming", "complete"]) {
        const f = fixture(status);
        assert.match((await f.saveGameResults(f.form)).error, /locked games/);
        assert.equal(f.writes.length, 0);
    }
    const f = fixture();
    f.form.set("result-b", "invalid");
    assert.match((await f.saveGameResults(f.form)).error, /result for every pick/);
    assert.equal(f.writes.length, 0);
});
