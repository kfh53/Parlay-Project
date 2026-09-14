const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadTs } = require("./load-ts.cjs");
const { buildEntityWinRates } = loadTs("lib/entity-win-rates.ts");

test("entity records pool group picks, isolate users, and exclude pushes from decisions", () => {
    const data = buildEntityWinRates([
        { user_id: "u1", player_name: " Jane Doe ", team_name: "Jets", result: "win" },
        { user_id: "u2", player_name: "jane doe", team_name: "Jets", result: "loss" },
        { user_id: "u1", player_name: "Jane Doe", team_name: "Jets", result: "push" },
        { user_id: "u1", player_name: "Jane Doe", team_name: "Jets", result: null },
        { user_id: "u1", player_name: null, team_name: "Jets", result: "win" }
    ]);
    assert.deepEqual(data.player.group, [{ name: "Jane Doe", wins: 1, losses: 1, pushes: 1 }]);
    assert.deepEqual(data.player.u1, [{ name: "Jane Doe", wins: 1, losses: 0, pushes: 1 }]);
    assert.deepEqual(data.player.u2, [{ name: "jane doe", wins: 0, losses: 1, pushes: 0 }]);
    assert.deepEqual(data.team.group, [{ name: "Jets", wins: 2, losses: 1, pushes: 1 }]);
});
