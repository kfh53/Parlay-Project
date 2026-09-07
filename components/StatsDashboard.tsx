"use client";

import { useState } from "react";
import WinRateChart, { WinRateSeries } from "./WinRateChart";
import type { calculateParlayProfit } from "@/lib/profit";

export type StatsDataset = {
    value: string;
    label: string;
    completedParlays: number;
    wins: number;
    losses: number;
    winRate: string;
    profit: ReturnType<typeof calculateParlayProfit>;
    groupStats: {
        parlays: number;
        wins: number;
        losses: number;
        pushes: number;
        parlayKillerParlays: number;
        winRate: string;
        recentForm: string;
        biggestWinStreak: number;
        biggestLossStreak: number;
        averageOdds: string;
        averageWinningOdds: string;
        impliedProbability: string;
        edge: string;
    };
    playerStats: Array<{
        id: string; name: string; wins: number; losses: number; pushes: number; parlayKillers: number;
        total: number; winRate: string; recentForm: string; biggestWinStreak: number; biggestLossStreak: number;
        averageOdds: string; averageWinningOdds: string; impliedProbability: string; edge: string;
    }>;
    chartSeries: WinRateSeries[];
    dates: string[];
};

export default function StatsDashboard({ datasets }: { datasets: StatsDataset[] }) {
    const [period, setPeriod] = useState("all");
    const stats = datasets.find(dataset => dataset.value === period) ?? datasets[0];
    const recordHeadings = ["Player", "Picks", "Wins", "Losses", "Pushes", "Parlay killers", "Win rate", "Recent form", "Best W streak", "Worst L streak"];
    const oddsHeadings = ["Player", "Average odds", "Average winning odds", "Implied win probability", "Performance vs. expected"];

    return <main className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-slate-100">Stats</h1>
            <div className="flex items-center gap-3">
                <label htmlFor="stats-period" className="text-sm font-semibold text-slate-300">Season</label>
                <select id="stats-period" value={period} onChange={event => setPeriod(event.target.value)} className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100">
                    {datasets.map(dataset => <option key={dataset.value} value={dataset.value}>{dataset.label}</option>)}
                </select>
            </div>
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-sm">
            <div className="border-b border-slate-700 px-5 py-4">
                <h2 className="text-lg font-bold text-slate-100">Group parlay performance</h2>
            </div>
            <div className="divide-y divide-slate-700">
                <MetricGroup label="Results" columns="five">
                    <GroupMetric label="Completed parlays" value={stats.groupStats.parlays} />
                    <GroupMetric label="Parlay wins" value={stats.groupStats.wins} tone="emerald" />
                    <GroupMetric label="Parlay losses" value={stats.groupStats.losses} tone="red" />
                    <GroupMetric label="Parlay pushes" value={stats.groupStats.pushes} tone="amber" />
                    <GroupMetric label="Parlay win rate" value={stats.groupStats.winRate} tone="blue" />
                </MetricGroup>
                <MetricGroup label="Momentum">
                    <GroupMetric label="Recent parlay form" value={stats.groupStats.recentForm} />
                    <GroupMetric label="Best win streak" value={stats.groupStats.biggestWinStreak} tone="emerald" />
                    <GroupMetric label="Worst loss streak" value={stats.groupStats.biggestLossStreak} tone="red" />
                    <GroupMetric label="Parlay killer parlays" value={stats.groupStats.parlayKillerParlays} tone="red" />
                </MetricGroup>
                <MetricGroup label="Odds">
                    <GroupMetric label="Average parlay odds" value={stats.groupStats.averageOdds} />
                    <GroupMetric label="Average winning parlay odds" value={stats.groupStats.averageWinningOdds} tone="emerald" />
                    <GroupMetric label="Implied win probability" value={stats.groupStats.impliedProbability} />
                    <GroupMetric label="Performance vs. expected" value={stats.groupStats.edge} tone="blue" />
                </MetricGroup>
            </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-sm">
            <div className="border-b border-slate-700 px-5 py-4">
                <h2 className="text-lg font-bold text-slate-100">Profit</h2>
                {stats.profit.unpricedWins > 0 && <p className="mt-2 text-sm text-amber-300">Profit is unavailable until valid total odds are entered for {stats.profit.unpricedWins} winning {stats.profit.unpricedWins === 1 ? "parlay" : "parlays"}.</p>}
            </div>
            <div className="grid gap-px bg-slate-700 sm:grid-cols-3">
                <ProfitMetric label="Standard odds" value={stats.profit.standard} />
                <ProfitMetric label="25% odds boost" value={stats.profit.boost25} />
                <ProfitMetric label="50% odds boost" value={stats.profit.boost50} />
            </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-sm">
            <div className="border-b border-slate-700 px-5 py-4"><h2 className="text-lg font-bold text-slate-100">Player parlay records</h2></div>
            {!stats.playerStats.length ? <p className="px-5 py-10 text-center text-slate-500">No completed parlays for this period.</p> :
                <div className="overflow-x-auto"><table className="w-full min-w-[50rem] text-left text-sm">
                    <thead className="bg-slate-800 text-xs uppercase tracking-wide text-slate-400"><tr>{recordHeadings.map(label => <th key={label} className="whitespace-nowrap px-5 py-3 font-semibold">{label}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">{stats.playerStats.map(player => <tr key={player.id}>
                        <td className="px-5 py-4 font-semibold text-slate-100">{player.name}</td><td className="px-5 py-4">{player.total}</td>
                        <td className="px-5 py-4 text-emerald-300">{player.wins}</td><td className="px-5 py-4 text-red-300">{player.losses}</td>
                        <td className="px-5 py-4 text-amber-300">{player.pushes}</td><td className="px-5 py-4 text-red-300">{player.parlayKillers}</td><td className="px-5 py-4">{player.winRate}</td>
                        <td className="px-5 py-4 font-semibold">{player.recentForm}</td><td className="px-5 py-4 text-emerald-300">{player.biggestWinStreak}</td><td className="px-5 py-4 text-red-300">{player.biggestLossStreak}</td>
                    </tr>)}</tbody>
                </table></div>}
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-sm">
            <div className="border-b border-slate-700 px-5 py-4"><h2 className="text-lg font-bold text-slate-100">Odds performance</h2></div>
            {!stats.playerStats.length ? <p className="px-5 py-10 text-center text-slate-500">No completed picks for this period.</p> :
                <div className="overflow-x-auto"><table className="w-full min-w-[48rem] text-left text-sm">
                    <thead className="bg-slate-800 text-xs uppercase tracking-wide text-slate-400"><tr>{oddsHeadings.map(label => <th key={label} className="whitespace-nowrap px-5 py-3 font-semibold">{label}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">{stats.playerStats.map(player => <tr key={player.id}>
                        <td className="px-5 py-4 font-semibold text-slate-100">{player.name}</td><td className="px-5 py-4">{player.averageOdds}</td>
                        <td className="px-5 py-4 text-emerald-300">{player.averageWinningOdds}</td><td className="px-5 py-4">{player.impliedProbability}</td>
                        <td className="px-5 py-4 font-semibold text-blue-300">{player.edge}</td>
                    </tr>)}</tbody>
                </table></div>}
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-sm">
            <div className="mb-5"><h2 className="text-lg font-bold text-slate-100">Win percentage over time</h2></div>
            <WinRateChart series={stats.chartSeries} dates={stats.dates} />
        </section>
    </main>;
}


function ProfitMetric({ label, value }: { label: string; value: number | null }) {
    const rounded = value === null ? null : Number(value.toFixed(2));
    return <GroupMetric label={label}
        value={rounded === null ? "Unavailable" : `${rounded > 0 ? "+" : ""}${rounded.toFixed(2)} units`}
        tone={rounded === null || rounded === 0 ? "slate" : rounded > 0 ? "emerald" : "red"} />;
}

function GroupMetric({ label, value, tone = "slate" }: {
    label: string;
    value: string | number;
    tone?: "slate" | "emerald" | "red" | "blue" | "amber";
}) {
    const valueStyles = {
        slate: "text-slate-100",
        emerald: "text-emerald-300",
        red: "text-red-300",
        blue: "text-blue-300",
        amber: "text-amber-300"
    };
    return <div className="min-h-28 bg-slate-900 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className={`mt-2 text-2xl font-bold ${valueStyles[tone]}`}>{value}</p>
    </div>;
}

function MetricGroup({ label, columns = "four", children }: {
    label: string;
    columns?: "four" | "five";
    children: React.ReactNode;
}) {
    const desktopColumns = columns === "five" ? "lg:grid-cols-5" : "lg:grid-cols-4";
    return <div>
        <h3 className="bg-slate-950/40 px-5 py-2 text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</h3>
        <div className={`grid gap-px bg-slate-700 sm:grid-cols-2 ${desktopColumns}`}>{children}</div>
    </div>;
}
