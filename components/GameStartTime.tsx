"use client";

import { useState, type FormEvent } from "react";
import { updateGameStartTime } from "@/app/actions/games";
import { easternDateTime, formatKickoff } from "@/lib/game-time";
import type { Parlay } from "@/lib/types";

export default function GameStartTime({ parlay }: { parlay: Parlay }) {
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        setError("");
        try {
            await updateGameStartTime(new FormData(event.currentTarget));
            setEditing(false);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Start time could not be saved.");
        } finally {
            setSaving(false);
        }
    }

    return <div className="mt-2 text-sm text-slate-300">
        {editing ? <form onSubmit={save} className="space-y-2">
            <input type="hidden" name="id" value={parlay.id} />
            <label htmlFor={`start-${parlay.id}`} className="block font-semibold">Start time (Eastern)</label>
            <input id={`start-${parlay.id}`} name="gameTime" type="time" required disabled={saving}
                defaultValue={parlay.starts_at ? easternDateTime(parlay.starts_at).time : ""}
                className="w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100" />
            <div className="flex gap-2">
                <button disabled={saving} className="rounded-md bg-blue-600 px-3 py-1.5 font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
                <button type="button" disabled={saving} onClick={() => setEditing(false)} className="rounded-md bg-slate-700 px-3 py-1.5 disabled:opacity-50">Cancel</button>
            </div>
            {error && <p role="alert" className="text-red-300">{error}</p>}
        </form> : <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{parlay.starts_at ? `Kickoff: ${formatKickoff(parlay.starts_at)}` : "Start time not set"}</span>
            {parlay.status !== "complete" && <button type="button" onClick={() => { setError(""); setEditing(true); }}
                aria-label={`${parlay.starts_at ? "Edit" : "Set"} start time for ${parlay.title}`}
                className="font-semibold text-blue-300 hover:text-blue-200">{parlay.starts_at ? "Edit" : "Set time"}</button>}
        </div>}
    </div>;
}
