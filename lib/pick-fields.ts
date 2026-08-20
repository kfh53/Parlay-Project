export const BET_TYPE_OPTIONS = [
    ["anytime_td", "Anytime touchdown"],
    ["passing_yards", "Passing yards"],
    ["passing_touchdowns", "Passing touchdowns"],
    ["passing_attempts", "Passing attempts"],
    ["passing_rushing_yards", "Passing + rushing yards"],
    ["completions", "Completions"],
    ["interceptions", "Interceptions"],
    ["rushing_yards", "Rushing yards"],
    ["rushing_touchdowns", "Rushing touchdowns"],
    ["rushing_attempts", "Rushing attempts"],
    ["rushing_receiving_yards", "Rushing + receiving yards"],
    ["receiving_yards", "Receiving yards"],
    ["receptions", "Receptions"],
    ["longest_reception", "Longest reception"],
    ["tackles", "Tackles"],
    ["tackles_assists", "Tackles + assists"],
    ["field_goals", "Field goals"],
    ["extra_points", "Extra points"],
    ["kicking_points", "Kicking points"],
    ["moneyline", "Moneyline"],
    ["spread", "Spread"],
    ["team_total", "Team total"],
    ["game_total", "Game total"],
    ["first_half_total", "First-half total"]
] as const;

export type BetType = (typeof BET_TYPE_OPTIONS)[number][0];

const BET_TYPES = new Set<string>(BET_TYPE_OPTIONS.map(([value]) => value));
const TEAM_MARKETS = new Set<BetType>(["moneyline", "spread", "team_total"]);
const GAME_MARKETS = new Set<BetType>(["game_total", "first_half_total"]);

export function isBetType(value: string): value is BetType {
    return BET_TYPES.has(value);
}

export function betTypeNeedsPlayer(value: BetType) {
    return !TEAM_MARKETS.has(value) && !GAME_MARKETS.has(value);
}

export function betTypeNeedsTeam(value: BetType) {
    return !GAME_MARKETS.has(value);
}

export function matchupTeams(title: string): string[] {
    const match = title.match(/^\s*([A-Z]{2,3})\s+vs\.?\s+([A-Z]{2,3})\s*$/i);
    return match ? [match[1].toUpperCase(), match[2].toUpperCase()] : [];
}
