import { BET_TYPE_OPTIONS } from "./pick-fields";

export type BetTypeRecord = { type: string; name: string; wins: number; losses: number; pushes: number };
export type BetTypeWinRates = Record<string, BetTypeRecord[]>;

const labels = new Map<string, string>(BET_TYPE_OPTIONS.map(([type, label]) => [type, label]));

export function buildBetTypeWinRates(picks: Array<{ user_id: string; bet_type?: string | null; result?: string | null }>): BetTypeWinRates {
    const scopes = new Map<string, Map<string, BetTypeRecord>>();
    for (const pick of picks) {
        const type = pick.bet_type?.trim();
        if (!type || !["win", "loss", "push"].includes(pick.result ?? "")) continue;
        for (const scope of ["group", pick.user_id]) {
            const records = scopes.get(scope) ?? new Map<string, BetTypeRecord>();
            const record = records.get(type) ?? {
                type, name: labels.get(type) ?? type.replaceAll("_", " "), wins: 0, losses: 0, pushes: 0
            };
            if (pick.result === "win") record.wins++;
            else if (pick.result === "loss") record.losses++;
            else record.pushes++;
            records.set(type, record);
            scopes.set(scope, records);
        }
    }
    return Object.fromEntries([...scopes].map(([scope, records]) => [scope, [...records.values()]]));
}
