"use client";

import { updateParlayTotalOdds } from "@/app/actions/parlays";

export default function TotalOddsForm({ id, totalOdds }: { id: string; totalOdds?: number | null }) {
    return (
        <form action={updateParlayTotalOdds} className="space-y-2 rounded-lg border border-amber-800 bg-amber-950/60 p-3">
            <input type="hidden" name="id" value={id} />
            <label className="block text-sm font-semibold text-slate-200" htmlFor={`total-odds-${id}`}>Total Odds</label>
            <div className="flex gap-2">
                <input id={`total-odds-${id}`} name="totalOdds" type="number" defaultValue={totalOdds ?? ""} placeholder="e.g. +250" required className="min-w-0 flex-1 rounded border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100" />
                <button className="rounded bg-amber-500 px-3 py-2 font-semibold text-white">Save</button>
            </div>
        </form>
    );
}
