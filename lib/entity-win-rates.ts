export type EntityKind = "player" | "team";
export type EntityRecord = { name: string; wins: number; losses: number; pushes: number };
export type EntityWinRates = Record<EntityKind, Record<string, EntityRecord[]>>;

type EntityPick = {
    user_id: string;
    player_name?: string | null;
    team_name?: string | null;
    result?: string | null;
};

export function buildEntityWinRates(picks: EntityPick[]): EntityWinRates {
    const buckets: Record<EntityKind, Map<string, Map<string, EntityRecord>>> = {
        player: new Map(), team: new Map()
    };
    for (const pick of picks) {
        if (!['win', 'loss', 'push'].includes(pick.result ?? '')) continue;
        for (const [kind, rawName] of [["player", pick.player_name], ["team", pick.team_name]] as const) {
            const name = rawName?.trim();
            if (!name) continue;
            for (const scope of ["group", pick.user_id]) {
                const scoped = buckets[kind].get(scope) ?? new Map<string, EntityRecord>();
                const key = name.toLocaleLowerCase();
                const record = scoped.get(key) ?? { name, wins: 0, losses: 0, pushes: 0 };
                if (pick.result === "win") record.wins++;
                else if (pick.result === "loss") record.losses++;
                else record.pushes++;
                scoped.set(key, record);
                buckets[kind].set(scope, scoped);
            }
        }
    }
    return {
        player: Object.fromEntries([...buckets.player].map(([scope, records]) => [scope, [...records.values()]])),
        team: Object.fromEntries([...buckets.team].map(([scope, records]) => [scope, [...records.values()]]))
    };
}
