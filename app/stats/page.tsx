import { getSupabaseServerClient } from "@/lib/supabase-server";
import { WinRateSeries } from "@/components/WinRateChart";
import StatsDashboard, { StatsDataset } from "@/components/StatsDashboard";

type ParlayOutcome = "win" | "loss" | "push";

function getParlayOutcome(results: Array<string | null>): ParlayOutcome {
    if (results.some(result => result === "loss")) return "loss";
    if (results.some(result => result === "win")) return "win";
    return "push";
}

function formatWinRate(wins: number, total: number) {
    return total ? `${((wins / total) * 100).toFixed(2)}%` : "0.00%";
}

function getSeasonYear(gameDate: string) {
    const [year, month] = gameDate.split("-").map(Number);
    return String(month <= 2 ? year - 1 : year);
}

export default async function StatsPage() {
    const supabase = await getSupabaseServerClient();

    const [{ data: parlays, error }, { data: profiles }] = await Promise.all([
        supabase
            .from("parlays")
            .select(`
                id,
                    game_date,
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

    const chronologicalParlays = [...parlayResults].sort((a, b) =>
        a.game_date.localeCompare(b.game_date) || a.id.localeCompare(b.id)
    );
    function buildWinRateDataset(games: typeof chronologicalParlays): WinRateSeries[] {
        const cumulativeRecords = new Map<string, { wins: number; decisions: number }>();
        const series: WinRateSeries[] = (profiles ?? []).map(profile => ({
            id: profile.id,
            name: profile.display_name,
            points: []
        }));

        games.forEach((parlay, game) => {
            for (const player of series) {
                const pick = parlay.picks.find(item => item.user_id === player.id);
                const record = cumulativeRecords.get(player.id) ?? { wins: 0, decisions: 0 };

                if (pick?.result === "win") {
                    record.wins += 1;
                    record.decisions += 1;
                } else if (pick?.result === "loss") {
                    record.decisions += 1;
                }

                cumulativeRecords.set(player.id, record);
                if (record.decisions > 0) {
                    player.points.push({
                        game,
                        date: parlay.game_date,
                        winRate: (record.wins / record.decisions) * 100,
                        wins: record.wins,
                        decisions: record.decisions
                    });
                }
            }
        });

        return series;
    }

    const seasons = [...new Set(chronologicalParlays.map(parlay => getSeasonYear(parlay.game_date)))]
        .sort((a, b) => b.localeCompare(a));
    function buildStatsDataset(games: typeof chronologicalParlays, value: string, label: string): StatsDataset {
        const stats = new Map<string, StatsDataset["playerStats"][number]>();
        for (const parlay of games) {
            for (const pick of parlay.picks) {
                const current = stats.get(pick.user_id) ?? {
                    id: pick.user_id, name: profileNames.get(pick.user_id) ?? "Unknown player",
                    wins: 0, losses: 0, pushes: 0, parlayKillers: 0, total: 0, winRate: "0.00%"
                };
                if (pick.result === "win") current.wins++;
                if (pick.result === "loss") current.losses++;
                if (pick.result === "push") current.pushes++;
                if (pick.parlay_killer) current.parlayKillers++;
                current.total = current.wins + current.losses + current.pushes;
                current.winRate = formatWinRate(current.wins, current.wins + current.losses);
                stats.set(pick.user_id, current);
            }
        }
        const records = [...stats.values()].sort((a, b) =>
            b.wins / (b.wins + b.losses) - a.wins / (a.wins + a.losses) || b.wins - a.wins || a.name.localeCompare(b.name)
        );
        const periodWins = games.filter(parlay => parlay.outcome === "win").length;
        const periodLosses = games.filter(parlay => parlay.outcome === "loss").length;
        return {
            value, label, completedParlays: games.length, wins: periodWins, losses: periodLosses,
            winRate: formatWinRate(periodWins, periodWins + periodLosses), playerStats: records,
            chartSeries: buildWinRateDataset(games), dates: games.map(parlay => parlay.game_date)
        };
    }

    const datasets = [
        buildStatsDataset(chronologicalParlays, "all", "All time"),
        ...seasons.map(season => buildStatsDataset(
            chronologicalParlays.filter(parlay => getSeasonYear(parlay.game_date) === season),
            season,
            `${season} season`
        ))
    ];

    return <StatsDashboard datasets={datasets} />;
}
