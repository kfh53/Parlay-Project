"use client";

import { useState } from "react";
import WinRateChart, { WinRateSeries } from "./WinRateChart";

export type StatsDataset = {
    value: string;
    label: string;
    completedParlays: number;
    wins: number;
    losses: number;
    winRate: string;
    groupStats: {
        picks: number;
        wins: number;
        losses: number;
        pushes: number;
        parlayKillers: number;
        winRate: string;
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
    const oddsHeadings = ["Player", "Average odds", "Average winning odds", "Implied win probability", "Actual vs. implied"];

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

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Completed parlays" value={stats.completedParlays} />
            <StatCard label="Parlay wins" value={stats.wins} tone="emerald" />
            <StatCard label="Parlay losses" value={stats.losses} tone="red" />
            <StatCard label="Parlay win rate" value={stats.winRate} tone="blue" />
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-sm">
            <div className="border-b border-slate-700 px-5 py-4">
                <h2 className="text-lg font-bold text-slate-100">Group pick performance</h2>
                <p className="mt-1 text-sm text-slate-400">Combined results for every player in the selected period. Voided and pushed legs are excluded from win rate and odds calculations.</p>
            </div>
            <div className="grid gap-px bg-slate-700 sm:grid-cols-2 lg:grid-cols-5">
                <GroupMetric label="Picks" value={stats.groupStats.picks} />
                <GroupMetric label="Wins" value={stats.groupStats.wins} tone="emerald" />
                <GroupMetric label="Losses" value={stats.groupStats.losses} tone="red" />
                <GroupMetric label="Pushes" value={stats.groupStats.pushes} tone="amber" />
                <GroupMetric label="Pick win rate" value={stats.groupStats.winRate} tone="blue" />
                <GroupMetric label="Average odds" value={stats.groupStats.averageOdds} />
                <GroupMetric label="Average winning odds" value={stats.groupStats.averageWinningOdds} tone="emerald" />
                <GroupMetric label="Implied win probability" value={stats.groupStats.impliedProbability} />
                <GroupMetric label="Actual vs. implied" value={stats.groupStats.edge} tone="blue" />
                <GroupMetric label="Parlay killers" value={stats.groupStats.parlayKillers} tone="red" />
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
            <div className="border-b border-slate-700 px-5 py-4"><h2 className="text-lg font-bold text-slate-100">Odds performance</h2><p className="mt-1 text-sm text-slate-400">Voided and pushed legs are excluded. Average odds are calculated by averaging implied probabilities, then converting the result to standard American odds. Actual vs. implied is the player&apos;s win rate minus the average implied probability of their decided picks.</p></div>
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
            <div className="mb-5"><h2 className="text-lg font-bold text-slate-100">Win percentage over time</h2><p className="mt-1 text-sm text-slate-400">Cumulative pick win rate; pushes are excluded.</p></div>
            <WinRateChart series={stats.chartSeries} dates={stats.dates} />
        </section>
    </main>;
}

function StatCard({ label, value, tone = "slate" }: { label: string; value: string | number; tone?: "slate" | "emerald" | "red" | "blue" }) {
    const styles = { slate: "border-slate-700 bg-slate-900", emerald: "border-emerald-800 bg-emerald-950/60", red: "border-red-800 bg-red-950/60", blue: "border-blue-800 bg-blue-950/60" };
    return <div className={`rounded-xl border p-5 ${styles[tone]}`}><p className="text-sm font-medium text-slate-400">{label}</p><p className="mt-2 text-3xl font-bold text-slate-100">{value}</p></div>;
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
