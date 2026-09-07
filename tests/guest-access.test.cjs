const { test } = require("node:test");
const assert = require("node:assert/strict");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { loadTs } = require("./load-ts.cjs");

const blocked = () => { throw new Error("Unexpected write"); };
const uiMocks = {
    "@/app/actions/games": { updateGameStartTime: blocked, createGame: blocked, ensurePrimeTimeGames: blocked },
    "@/app/actions/picks": { savePick: blocked, lockPick: blocked },
    "@/app/actions/parlays": { deleteGame: blocked, completeGame: blocked, promoteGame: blocked },
    "@/app/actions/results": { saveGameResults: blocked }
};
const profiles = [{ id: "player", display_name: "Player One" }];
const game = {
    id: "game", title: "BAL vs PIT", game_date: "2026-09-07", starts_at: "2026-09-08T00:15:00Z",
    status: "open", created_by: "player", picks: [
        { id: "pick", user_id: "player", selection: "Over 200 passing yards", odds: 120, is_locked: false }
    ]
};

test("guest game cards show unlocked picks and kickoff without mutation controls", () => {
    const Card = loadTs("components/GameCard.tsx", uiMocks).default;
    for (const status of ["open", "locked"]) {
        const html = renderToStaticMarkup(React.createElement(Card, {
            parlay: { ...game, status }, profiles, currentUserId: null
        }));
        assert.match(html, /Over 200 passing yards/);
        assert.match(html, /Player One/);
        assert.match(html, /8:15 PM EDT/);
        assert.doesNotMatch(html, /<button|<form|<input|Your pick is locked|\(You\)/);
    }
});
test("participant game cards retain editing and pick controls", () => {
    const Card = loadTs("components/GameCard.tsx", uiMocks).default;
    const html = renderToStaticMarkup(React.createElement(Card, { parlay: game, profiles, currentUserId: "player" }));
    assert.match(html, /<button/);
    assert.match(html, /Delete BAL vs PIT/);
    assert.match(html, /Edit start time/);
    assert.match(html, /Lock My Pick/);
});
test("guest dashboard shows current and completed games without mutation controls", async () => {
    let statuses;
    const older = { ...game, id: "older", title: "Older matchup", status: "complete", game_date: "2026-09-01" };
    const newer = { ...game, id: "newer", title: "Newer matchup", status: "complete", game_date: "2026-09-05" };
    const db = {
        auth: { getUser: async () => ({ data: { user: null } }) },
        from: table => ({
            select() { return this; },
            in(column, values) { assert.equal(column, "status"); statuses = values; return this; },
            order() { return Promise.resolve({ data: table === "parlays" ? [older, game, newer] : profiles, error: null }); }
        })
    };
    const Page = loadTs("app/dashboard/page.tsx", {
        ...uiMocks, "@/lib/supabase-server": { getSupabaseServerClient: async () => db }
    }).default;
    const html = renderToStaticMarkup(await Page());
    assert.deepEqual(statuses, ["open", "locked", "complete"]);
    assert.match(html, /Completed Games/);
    assert.ok(html.indexOf("Newer matchup") < html.indexOf("Older matchup"));
    assert.match(html, /Over 200 passing yards/);
    assert.doesNotMatch(html, /Upcoming Games|<form|<button/);
});
test("guest stats render completed results and profit without a login", async () => {
    const completed = { ...game, total_odds: 600, status: "complete", picks: [{ ...game.picks[0], result: "win", parlay_killer: false }] };
    const db = {
        from: table => ({
            select() { return this; },
            eq(column, value) { assert.equal(column, "status"); assert.equal(value, "complete"); return this; },
            order() { return this; },
            then(resolve) { return Promise.resolve({ data: table === "parlays" ? [completed] : profiles, error: null }).then(resolve); }
        })
    };
    const Page = loadTs("app/stats/page.tsx", { "@/lib/supabase-server": { getSupabaseServerClient: async () => db } }).default;
    const html = renderToStaticMarkup(await Page());
    assert.match(html, /Profit/);
    assert.match(html, /\+6.00 units/);
    assert.match(html, /Player One/);
});
test("direct mutation actions reject guests before accessing writable data", async () => {
    const db = { auth: { getUser: async () => ({ data: { user: null }, error: null }) }, from: blocked };
    const mocks = {
        "@/lib/supabase-server": { getSupabaseServerClient: async () => db },
        "@/lib/supabase-admin": { getSupabaseAdminClient: blocked },
        "@/lib/game-lock-email": { sendGameLockedEmails: blocked },
        "next/cache": { revalidatePath: blocked }
    };
    const games = loadTs("app/actions/games.ts", mocks);
    const parlays = loadTs("app/actions/parlays.ts", mocks);
    const picks = loadTs("app/actions/picks.ts", mocks);
    const results = loadTs("app/actions/results.ts", mocks);
    const form = new FormData();
    for (const [key, value] of Object.entries({
        id: "game", pickId: "pick", parlayId: "game", title: "BAL vs PIT", gameDate: "2026-09-07", gameTime: "20:15",
        totalOdds: "600", selection: "Over 200 yards", odds: "120", betType: "passing_yards", playerName: "Test Player", teamName: "BAL"
    })) form.set(key, value);
    for (const action of [games.createGame, games.updateGameStartTime, parlays.deleteGame, parlays.promoteGame, parlays.completeGame, picks.lockPick]) {
        await assert.rejects(action(form), /not authenticated/);
    }
    assert.match((await picks.savePick(form)).error, /sign in/i);
    assert.match((await results.saveGameResults(form)).error, /sign in/i);
    await games.ensurePrimeTimeGames();
});
test("proxy permits public games/stats but protects creation routes", async () => {
    const { proxy } = loadTs("proxy.ts", {
        "@supabase/ssr": { createServerClient: () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }) },
        "next/server": { NextResponse: { next: () => ({ kind: "next" }), redirect: url => ({ kind: "redirect", url }) } }
    });
    function request(pathname) {
        const nextUrl = new URL("https://example.com" + pathname);
        nextUrl.clone = () => new URL(nextUrl);
        return { nextUrl, cookies: { getAll: () => [] } };
    }
    for (const path of ["/dashboard", "/stats"]) assert.equal((await proxy(request(path))).kind, "next");
    for (const path of ["/picks/new", "/parlays/new"]) {
        const response = await proxy(request(path));
        assert.equal(response.kind, "redirect");
        assert.equal(response.url.pathname, "/login");
    }
});
