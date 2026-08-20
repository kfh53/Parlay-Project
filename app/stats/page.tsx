import { getSupabaseServerClient } from "@/lib/supabase-server";

type ParlayOutcome = "win" | "loss" | "push";

function getParlayOutcome(results: Array<string | null>): ParlayOutcome {
    if (results.some(result => result === "loss")) return "loss";
    if (results.some(result => result === "win")) return "win";
    return "push";
}

function formatWinRate(wins: number, total: number) {
    return total ? `${((wins / total) * 100).toFixed(2)}%` : "0.00%";
}

export default async function StatsPage() {
    const supabase = await getSupabaseServerClient();

    const [{ data: parlays, error }, { data: profiles }] = await Promise.all([
        supabase
            .from("parlays")
            .select(`
                id,
                    status,
                    picks (
                        id,
                        user_id,
                        result,
                        parlay_killer
                    )
            `)
            .eq("status", "complete")
            .order("game_date", { ascending: false }),
        supabase
            .from("profiles")
            .select("id, display_name")
    ]);

    if (error) {
        console.error("Error loading stats:", error);
    }

    const profileNames = new Map(
        (profiles ?? []).map(profile => [profile.id, profile.display_name])
    );

    const parlayResults = (parlays ?? [])
        .filter(parlay => parlay.picks?.length)
        .map(parlay => ({
            ...parlay,
            outcome: getParlayOutcome(parlay.picks.map(pick => pick.result ?? null))
        }));

    const wins = parlayResults.filter(parlay => parlay.outcome === "win").length;
    const losses = parlayResults.filter(parlay => parlay.outcome === "loss").length;
    const decidedParlays = parlayResults.filter(parlay => parlay.outcome !== "push");
    const winRate = formatWinRate(wins, decidedParlays.length);

    const userStats = new Map<string, {
        id: string;
        name: string;
        wins: number;
        losses: number;
        pushes: number;
        parlayKillers: number;
    }>();

    for (const parlay of parlayResults) {
        for (const pick of parlay.picks) {
            const stat = userStats.get(pick.user_id) ?? {
                id: pick.user_id,
                name: profileNames.get(pick.user_id) ?? "Unknown player",
                wins: 0,
                losses: 0,
                pushes: 0,
                parlayKillers: 0
            };
            if (pick.result === "win") stat.wins += 1;
            if (pick.result === "loss") stat.losses += 1;
            if (pick.result === "push") stat.pushes += 1;
            if (pick.parlay_killer) stat.parlayKillers += 1;
            userStats.set(pick.user_id, stat);
        }
    }

    const playerStats = [...userStats.values()]
        .map(stat => {
            const total = stat.wins + stat.losses + stat.pushes;
            return { ...stat, total, winRate: formatWinRate(stat.wins, stat.wins + stat.losses) };
        })
        .sort((a, b) => b.wins / (b.wins + b.losses) - a.wins / (a.wins + a.losses) || b.wins - a.wins || a.name.localeCompare(b.name));

    return (
        <main className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-100">
                    Stats
                </h1>
            </div>

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Completed parlays" value={parlayResults.length} />
                <StatCard label="Parlay wins" value={wins} tone="emerald" />
                <StatCard label="Parlay losses" value={losses} tone="red" />
                <StatCard label="Parlay win rate" value={winRate} tone="blue" />
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-sm">
                <div className="border-b border-slate-700 px-5 py-4">
                    <h2 className="text-lg font-bold text-slate-100">Player parlay records</h2>
                </div>

                {playerStats.length === 0 ? (
                    <p className="px-5 py-10 text-center text-slate-500">
                        No completed parlays yet.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[50rem] text-left text-sm">
                            <thead className="bg-slate-800 text-xs uppercase tracking-wide text-slate-400">
                                <tr>
                                    <th className="px-5 py-3 font-semibold">Player</th>
                                    <th className="px-5 py-3 font-semibold">Parlays</th>
                                    <th className="px-5 py-3 font-semibold">Wins</th>
                                    <th className="px-5 py-3 font-semibold">Losses</th>
                                    <th className="px-5 py-3 font-semibold">Pushes</th>
                                    <th className="px-5 py-3 font-semibold">Parlay killers</th>
                                    <th className="px-5 py-3 font-semibold">Win rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 text-slate-300">
                                {playerStats.map(player => (
                                    <tr key={player.id}>
                                        <td className="px-5 py-4 font-semibold text-slate-100">{player.name}</td>
                                        <td className="px-5 py-4">{player.total}</td>
                                        <td className="px-5 py-4 text-emerald-300">{player.wins}</td>
                                        <td className="px-5 py-4 text-red-300">{player.losses}</td>
                                        <td className="px-5 py-4 text-amber-300">{player.pushes}</td>
                                        <td className="px-5 py-4 text-red-300">{player.parlayKillers}</td>
                                        <td className="px-5 py-4">{player.winRate}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}

function StatCard({
    label,
    value,
    tone = "slate"
}: {
    label: string;
    value: string | number;
    tone?: "slate" | "emerald" | "red" | "blue";
}) {
    const toneClasses = {
        slate: "border-slate-700 bg-slate-900",
        emerald: "border-emerald-800 bg-emerald-950/60",
        red: "border-red-800 bg-red-950/60",
        blue: "border-blue-800 bg-blue-950/60"
    };

    return (
        <div className={`rounded-xl border p-5 ${toneClasses[tone]}`}>
            <p className="text-sm font-medium text-slate-400">{label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-100">{value}</p>
        </div>
    );
}
