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

export function probabilityToAmerican(probability: number) {
    if (!Number.isFinite(probability) || probability <= 0 || probability >= 1) return null;
    return probability > 0.5
        ? -(probability * 100) / (1 - probability)
        : (100 * (1 - probability)) / probability;
}

export function formatAverageAmericanOdds(probabilityTotal: number, count: number) {
    if (!count) return "—";
    const americanOdds = probabilityToAmerican(probabilityTotal / count);
    if (americanOdds === null) return "—";

    // Conversion guarantees a standard American line: +100 or greater,
    // or -100 or less. Round only after averaging implied probabilities.
    const rounded = americanOdds < 0
        ? -Math.round(Math.abs(americanOdds))
        : Math.round(americanOdds);
    return `${rounded > 0 ? "+" : ""}${rounded}`;
}
