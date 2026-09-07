import { americanOddsToDecimal } from "./odds";

export function calculateParlayProfit(parlays: Array<{
    outcome: "win" | "loss" | "push";
    total_odds?: number | null;
}>) {
    let winnings = 0;
    let losses = 0;
    let unpricedWins = 0;

    for (const parlay of parlays) {
        if (parlay.outcome === "loss") losses++;
        if (parlay.outcome !== "win") continue;
        const decimalOdds = parlay.total_odds == null ? null : americanOddsToDecimal(parlay.total_odds);
        if (decimalOdds === null) unpricedWins++;
        else winnings += decimalOdds - 1;
    }

    return {
        standard: unpricedWins ? null : winnings - losses,
        boost25: unpricedWins ? null : winnings * 1.25 - losses,
        boost50: unpricedWins ? null : winnings * 1.5 - losses,
        unpricedWins
    };
}
