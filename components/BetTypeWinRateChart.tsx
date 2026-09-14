"use client";

import { useState } from "react";
import type { BetTypeRecord, BetTypeWinRates } from "@/lib/bet-type-win-rates";

type SortOrder = "winRate" | "wins" | "alphabetical";

export default function BetTypeWinRateChart({ data, users }: { data: BetTypeWinRates; users: { id: string; name: string }[] }) {
    const [scope, setScope] = useState("group");
    const [sortOrder, setSortOrder] = useState<SortOrder>("winRate");
    const records = [...(data[scope] ?? [])].filter(record => record.wins + record.losses > 0).sort((a, b) => {
        if (sortOrder === "alphabetical") return a.name.localeCompare(b.name);
        if (sortOrder === "wins") return b.wins - a.wins || rate(b) - rate(a) || a.name.localeCompare(b.name);
        return rate(b) - rate(a) || (b.wins + b.losses) - (a.wins + a.losses) || a.name.localeCompare(b.name);
    });

    return <section className="rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-100">Win rate by bet type</h2>
        <p className="mt-1 text-sm text-slate-400">Completed picks grouped by market. Pushes are excluded from win rates; each pick counts once.</p>
        <div className="mt-5 flex flex-wrap gap-3">
            <label className="flex flex-col gap-1 text-sm text-slate-300">Picks by
                <select value={scope} onChange={event => setScope(event.target.value)} className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100">
                    <option value="group">Whole group</option>
                    {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                </select>
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-300">Sort by
                <select value={sortOrder} onChange={event => setSortOrder(event.target.value as SortOrder)} className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100">
                    <option value="winRate">Win percentage</option>
                    <option value="wins">Total wins</option>
                    <option value="alphabetical">Alphabetically</option>
                </select>
            </label>
        </div>
        {!records.length ? <p className="py-10 text-center text-slate-500">No decided picks with a bet type for this selection.</p> :
            <div className="mt-5 max-h-[32rem] space-y-3 overflow-y-auto pr-2">
                {records.map(record => <BetTypeBar key={record.type} record={record} />)}
            </div>}
    </section>;
}

function BetTypeBar({ record }: { record: BetTypeRecord }) {
    const percentage = rate(record);
    const decisions = record.wins + record.losses;
    return <div className="rounded-lg border border-slate-700 bg-slate-950/30 p-3">
        <div className="mb-2 flex justify-between gap-3 text-sm"><span className="font-semibold text-slate-100">{record.name}</span><span className="shrink-0 text-slate-300">{percentage.toFixed(1)}% · {record.wins}–{record.losses}</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-700"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${percentage}%` }} /></div>
        <p className="mt-1 text-xs text-slate-500">{decisions} decided {decisions === 1 ? "pick" : "picks"}{record.pushes ? ` · ${record.pushes} pushes` : ""}</p>
    </div>;
}

function rate(record: BetTypeRecord) {
    return record.wins / (record.wins + record.losses) * 100;
}
