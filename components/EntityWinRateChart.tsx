"use client";

import { useState } from "react";
import type { EntityKind, EntityRecord, EntityWinRates } from "@/lib/entity-win-rates";

export default function EntityWinRateChart({ data, users }: { data: EntityWinRates; users: { id: string; name: string }[] }) {
    const [kind, setKind] = useState<EntityKind>("player");
    const [scope, setScope] = useState("group");
    const [selected, setSelected] = useState("");
    const records = [...(data[kind][scope] ?? [])]
        .filter(record => record.wins + record.losses > 0)
        .sort((a, b) => rate(b) - rate(a) || (b.wins + b.losses) - (a.wins + a.losses) || a.name.localeCompare(b.name));
    const selectedRecord = records.find(record => record.name.toLocaleLowerCase() === selected) ?? null;

    return <section className="rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-100">Win rate by player or team</h2>
        <p className="mt-1 text-sm text-slate-400">Completed picks that name each player or team. Pushes are excluded from win rates; each pick counts once.</p>
        <div className="mt-5 flex flex-wrap gap-3">
            <label className="flex flex-col gap-1 text-sm text-slate-300">Bet includes
                <select value={kind} onChange={event => { setKind(event.target.value as EntityKind); setSelected(""); }} className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100">
                    <option value="player">Player</option><option value="team">Team</option>
                </select>
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-300">Picks by
                <select value={scope} onChange={event => { setScope(event.target.value); setSelected(""); }} className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100">
                    <option value="group">Whole group</option>
                    {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                </select>
            </label>
            <label className="flex min-w-48 flex-col gap-1 text-sm text-slate-300">Highlight
                <select value={selectedRecord ? selected : ""} onChange={event => setSelected(event.target.value)} className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100">
                    <option value="">All {kind === "player" ? "players" : "teams"}</option>
                    {records.map(record => <option key={record.name.toLocaleLowerCase()} value={record.name.toLocaleLowerCase()}>{record.name}</option>)}
                </select>
            </label>
        </div>
        {selectedRecord && <p className="mt-5 text-sm text-slate-300"><strong className="text-slate-100">{selectedRecord.name}:</strong> {rate(selectedRecord).toFixed(1)}% · {selectedRecord.wins} wins, {selectedRecord.losses} losses{selectedRecord.pushes ? `, ${selectedRecord.pushes} pushes` : ""}</p>}
        {!records.length ? <p className="py-10 text-center text-slate-500">No decided picks with a {kind} for this selection.</p> :
            <div className="mt-5 max-h-[32rem] space-y-3 overflow-y-auto pr-2">
                {records.map(record => {
                    const percentage = rate(record);
                    const highlighted = selectedRecord?.name.toLocaleLowerCase() === record.name.toLocaleLowerCase();
                    return <div key={record.name.toLocaleLowerCase()} className={`rounded-lg border p-3 ${highlighted ? "border-blue-400 bg-blue-950/30" : "border-slate-700 bg-slate-950/30"}`}>
                        <div className="mb-2 flex justify-between gap-3 text-sm"><span className="font-semibold text-slate-100">{record.name}</span><span className="shrink-0 text-slate-300">{percentage.toFixed(1)}% · {record.wins}–{record.losses}</span></div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-700"><div className={`h-full rounded-full ${highlighted ? "bg-blue-400" : "bg-emerald-400"}`} style={{ width: `${percentage}%` }} /></div>
                        <p className="mt-1 text-xs text-slate-500">{record.wins + record.losses} decided {record.wins + record.losses === 1 ? "pick" : "picks"}{record.pushes ? ` · ${record.pushes} pushes` : ""}</p>
                    </div>;
                })}
            </div>}
    </section>;
}

function rate(record: EntityRecord) {
    return record.wins / (record.wins + record.losses) * 100;
}
