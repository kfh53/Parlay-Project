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
    playerStats: Array<{ id: string; name: string; wins: number; losses: number; pushes: number; parlayKillers: number; total: number; winRate: string }>;
    chartSeries: WinRateSeries[];
    dates: string[];
};

export default function StatsDashboard({ datasets }: { datasets: StatsDataset[] }) {
    const [period, setPeriod] = useState("all");
    const stats = datasets.find(dataset => dataset.value === period) ?? datasets[0];
    const headings = ["Player", "Parlays", "Wins", "Losses", "Pushes", "Parlay killers", "Win rate"];

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
            <div className="border-b border-slate-700 px-5 py-4"><h2 className="text-lg font-bold text-slate-100">Player parlay records</h2></div>
            {!stats.playerStats.length ? <p className="px-5 py-10 text-center text-slate-500">No completed parlays for this period.</p> :
                <div className="overflow-x-auto"><table className="w-full min-w-[50rem] text-left text-sm">
                    <thead className="bg-slate-800 text-xs uppercase tracking-wide text-slate-400"><tr>{headings.map(label => <th key={label} className="px-5 py-3 font-semibold">{label}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">{stats.playerStats.map(player => <tr key={player.id}>
                        <td className="px-5 py-4 font-semibold text-slate-100">{player.name}</td><td className="px-5 py-4">{player.total}</td>
                        <td className="px-5 py-4 text-emerald-300">{player.wins}</td><td className="px-5 py-4 text-red-300">{player.losses}</td>
                        <td className="px-5 py-4 text-amber-300">{player.pushes}</td><td className="px-5 py-4 text-red-300">{player.parlayKillers}</td><td className="px-5 py-4">{player.winRate}</td>
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
