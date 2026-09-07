import { getSupabaseServerClient } from "@/lib/supabase-server";
import { WinRateSeries } from "@/components/WinRateChart";
import StatsDashboard, { StatsDataset } from "@/components/StatsDashboard";
import { americanOddsToProbability, formatAverageAmericanOdds } from "@/lib/odds";

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
                        odds,
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
        type PlayerAccumulator = StatsDataset["playerStats"][number] & {
            winningProbabilityTotal: number;
            validWinningOddsCount: number;
            impliedProbabilityTotal: number;
            validDecisionOddsCount: number;
            winsWithValidOdds: number;
            currentResult: "W" | "L" | "P" | null;
            currentStreak: number;
        };
        const stats = new Map<string, PlayerAccumulator>();
        for (const parlay of games) {
            for (const pick of parlay.picks) {
                const current = stats.get(pick.user_id) ?? {
                    id: pick.user_id, name: profileNames.get(pick.user_id) ?? "Unknown player",
                    wins: 0, losses: 0, pushes: 0, parlayKillers: 0, total: 0, winRate: "0.00%",
                    recentForm: "—", biggestWinStreak: 0, biggestLossStreak: 0,
                    averageOdds: "—", averageWinningOdds: "—", impliedProbability: "—", edge: "—",
                    winningProbabilityTotal: 0, validWinningOddsCount: 0,
                    impliedProbabilityTotal: 0, validDecisionOddsCount: 0, winsWithValidOdds: 0,
                    currentResult: null, currentStreak: 0
                };
                if (pick.result === "win") current.wins++;
                if (pick.result === "loss") current.losses++;
                if (pick.result === "push") current.pushes++;
                if (pick.parlay_killer) current.parlayKillers++;

                const result = pick.result === "win" ? "W" : pick.result === "loss" ? "L" : null;
                if (result === null) {
                    current.currentResult = null;
                    current.currentStreak = 0;
                    current.recentForm = "—";
                } else {
                    if (result === current.currentResult) current.currentStreak++;
                    else {
                        current.currentResult = result;
                        current.currentStreak = 1;
                    }
                    current.recentForm = `${result}${current.currentStreak}`;
                    if (result === "W") current.biggestWinStreak = Math.max(current.biggestWinStreak, current.currentStreak);
                    if (result === "L") current.biggestLossStreak = Math.max(current.biggestLossStreak, current.currentStreak);
                }

                const impliedProbability = americanOddsToProbability(pick.odds);
                const isDecision = pick.result === "win" || pick.result === "loss";
                if (impliedProbability !== null && isDecision) {
                    if (pick.result === "win") {
                        current.winningProbabilityTotal += impliedProbability;
                        current.validWinningOddsCount++;
                    }
                }
                if (isDecision && impliedProbability !== null) {
                    current.impliedProbabilityTotal += impliedProbability;
                    current.validDecisionOddsCount++;
                    if (pick.result === "win") current.winsWithValidOdds++;
                }
                current.total = current.wins + current.losses + current.pushes;
                current.winRate = formatWinRate(current.wins, current.wins + current.losses);
                current.averageOdds = formatAverageAmericanOdds(
                    current.impliedProbabilityTotal,
                    current.validDecisionOddsCount
                );
                current.averageWinningOdds = formatAverageAmericanOdds(
                    current.winningProbabilityTotal,
                    current.validWinningOddsCount
                );
                const averageImpliedProbability = current.validDecisionOddsCount
                    ? current.impliedProbabilityTotal / current.validDecisionOddsCount
                    : 0;
                current.impliedProbability = current.validDecisionOddsCount ? formatPercent(averageImpliedProbability) : "—";
                const actualProbabilityForPricedPicks = current.validDecisionOddsCount
                    ? current.winsWithValidOdds / current.validDecisionOddsCount
                    : 0;
                current.edge = current.validDecisionOddsCount
                    ? formatPercentagePointDelta(actualProbabilityForPricedPicks - averageImpliedProbability)
                    : "—";
                stats.set(pick.user_id, current);
            }
        }
        const records: StatsDataset["playerStats"] = [...stats.values()].sort((a, b) =>
            (b.wins + b.losses ? b.wins / (b.wins + b.losses) : 0) -
            (a.wins + a.losses ? a.wins / (a.wins + a.losses) : 0) ||
            b.wins - a.wins || a.name.localeCompare(b.name)
        );
        const groupTotals = [...stats.values()].reduce((group, player) => ({
            picks: group.picks + player.total,
            wins: group.wins + player.wins,
            losses: group.losses + player.losses,
            pushes: group.pushes + player.pushes,
            parlayKillers: group.parlayKillers + player.parlayKillers,
            winningProbabilityTotal: group.winningProbabilityTotal + player.winningProbabilityTotal,
            validWinningOddsCount: group.validWinningOddsCount + player.validWinningOddsCount,
            impliedProbabilityTotal: group.impliedProbabilityTotal + player.impliedProbabilityTotal,
            validDecisionOddsCount: group.validDecisionOddsCount + player.validDecisionOddsCount,
            winsWithValidOdds: group.winsWithValidOdds + player.winsWithValidOdds
        }), {
            picks: 0, wins: 0, losses: 0, pushes: 0, parlayKillers: 0,
            winningProbabilityTotal: 0, validWinningOddsCount: 0,
            impliedProbabilityTotal: 0, validDecisionOddsCount: 0, winsWithValidOdds: 0
        });
        const groupAverageImpliedProbability = groupTotals.validDecisionOddsCount
            ? groupTotals.impliedProbabilityTotal / groupTotals.validDecisionOddsCount
            : 0;
        const groupActualProbability = groupTotals.validDecisionOddsCount
            ? groupTotals.winsWithValidOdds / groupTotals.validDecisionOddsCount
            : 0;
        const groupStats: StatsDataset["groupStats"] = {
            picks: groupTotals.picks,
            wins: groupTotals.wins,
            losses: groupTotals.losses,
            pushes: groupTotals.pushes,
            parlayKillers: groupTotals.parlayKillers,
            winRate: formatWinRate(groupTotals.wins, groupTotals.wins + groupTotals.losses),
            averageOdds: formatAverageAmericanOdds(
                groupTotals.impliedProbabilityTotal,
                groupTotals.validDecisionOddsCount
            ),
            averageWinningOdds: formatAverageAmericanOdds(
                groupTotals.winningProbabilityTotal,
                groupTotals.validWinningOddsCount
            ),
            impliedProbability: groupTotals.validDecisionOddsCount
                ? formatPercent(groupAverageImpliedProbability)
                : "—",
            edge: groupTotals.validDecisionOddsCount
                ? formatPercentagePointDelta(groupActualProbability - groupAverageImpliedProbability)
                : "—"
        };
        const periodWins = games.filter(parlay => parlay.outcome === "win").length;
        const periodLosses = games.filter(parlay => parlay.outcome === "loss").length;
        return {
            value, label, completedParlays: games.length, wins: periodWins, losses: periodLosses,
            winRate: formatWinRate(periodWins, periodWins + periodLosses), groupStats, playerStats: records,
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

function formatPercent(value: number) {
    return `${(value * 100).toFixed(2)}%`;
}

function formatPercentagePointDelta(value: number) {
    const percentagePoints = value * 100;
    return `${percentagePoints > 0 ? "+" : ""}${percentagePoints.toFixed(2)} pp`;
}
