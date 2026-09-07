export function isValidAmericanOdds(odds: number) {
    return Number.isSafeInteger(odds) && (odds <= -100 || odds >= 100);
}

export function americanOddsToDecimal(odds: number) {
    if (!isValidAmericanOdds(odds)) return null;
    return odds > 0 ? 1 + odds / 100 : 1 + 100 / -odds;
}

export function americanOddsToProbability(odds: number) {
    const decimalOdds = americanOddsToDecimal(odds);
    return decimalOdds === null ? null : 1 / decimalOdds;
}

export function decimalOddsToAmerican(decimalOdds: number) {
    if (!Number.isFinite(decimalOdds) || decimalOdds <= 1) return null;
    return decimalOdds >= 2
        ? (decimalOdds - 1) * 100
        : -100 / (decimalOdds - 1);
}

export function formatAverageAmericanOdds(decimalOddsTotal: number, count: number) {
    if (!count) return "—";
    const americanOdds = decimalOddsToAmerican(decimalOddsTotal / count);
    if (americanOdds === null) return "—";

    // Conversion guarantees a standard American line: +100 or greater,
    // or -100 or less. Round only after converting back from decimal odds.
    const rounded = Math.round(americanOdds);
    return `${rounded > 0 ? "+" : ""}${rounded}`;
}
