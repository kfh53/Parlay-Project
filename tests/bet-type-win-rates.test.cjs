const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadTs } = require("./load-ts.cjs");
const { buildBetTypeWinRates } = loadTs("lib/bet-type-win-rates.ts");

test("bet-type records use named market labels and keep group and user decisions separate", () => {
    const data = buildBetTypeWinRates([
        { user_id: "u1", bet_type: "passing_yards", result: "win" },
        { user_id: "u2", bet_type: "passing_yards", result: "loss" },
        { user_id: "u1", bet_type: "passing_yards", result: "push" },
        { user_id: "u1", bet_type: "moneyline", result: "win" },
        { user_id: "u1", bet_type: "moneyline", result: null },
        { user_id: "u1", bet_type: null, result: "win" }
    ]);
    assert.deepEqual(data.group, [
        { type: "passing_yards", name: "Passing yards", wins: 1, losses: 1, pushes: 1 },
        { type: "moneyline", name: "Moneyline", wins: 1, losses: 0, pushes: 0 }
    ]);
    assert.deepEqual(data.u2, [{ type: "passing_yards", name: "Passing yards", wins: 0, losses: 1, pushes: 0 }]);
});
