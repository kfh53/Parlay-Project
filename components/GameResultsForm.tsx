"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveGameResults } from "@/app/actions/results";
import { Parlay, Profile } from "@/lib/types";

export default function GameResultsForm({
    parlay,
    profiles,
    onClose
}: {
    parlay: Parlay;
    profiles: Profile[];
    onClose: () => void;
}) {
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const dialogRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        dialogRef.current?.focus();

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape" && !isSaving) onClose();
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isSaving, onClose]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setIsSaving(true);

        try {
            const result = await saveGameResults(new FormData(event.currentTarget));
            if (result.error) {
                setError(result.error);
                return;
            }

            onClose();
            router.refresh();
        } catch {
            setError("Results could not be saved. Please try again.");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
            onMouseDown={event => {
                if (event.target === event.currentTarget && !isSaving) onClose();
            }}
        >
            <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="results-form-title" tabIndex={-1} className="w-full max-w-xl outline-none">
                <form onSubmit={handleSubmit} className="max-h-[calc(100vh-2rem)] space-y-5 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 id="results-form-title" className="text-xl font-bold text-slate-100">Add game results</h2>
                            <p className="mt-1 text-sm text-slate-400">{parlay.title}</p>
                        </div>
                        <button type="button" onClick={onClose} disabled={isSaving} aria-label="Close results form" className="rounded-md px-2 py-1 text-2xl leading-none text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-50">
                            &times;
                        </button>
                    </div>

                    <input type="hidden" name="parlayId" value={parlay.id} />

                    <div className="space-y-3">
                        {parlay.picks.map(pick => {
                            const profile = profiles.find(item => item.id === pick.user_id);
                            return (
                                <label key={pick.id} className="block rounded-lg border border-slate-700 bg-slate-950/40 p-3">
                                    <span className="flex items-start justify-between gap-4">
                                        <span>
                                            <span className="block text-sm font-semibold text-slate-200">{profile?.display_name ?? "Player"}</span>
                                            <span className="mt-0.5 block text-sm text-slate-400">{pick.selection} ({pick.odds > 0 ? "+" : ""}{pick.odds})</span>
                                        </span>
                                        <select
                                            name={`result-${pick.id}`}
                                            defaultValue={pick.result ?? ""}
                                            required
                                            className="min-w-28 rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-100 outline-none [color-scheme:dark] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                        >
                                            <option value="" disabled>Select</option>
                                            <option value="win">Win</option>
                                            <option value="loss">Loss</option>
                                            <option value="push">Push</option>
                                        </select>
                                    </span>
                                </label>
                            );
                        })}
                    </div>

                    <div className="space-y-1.5 border-t border-slate-700 pt-4">
                        <label htmlFor={`total-odds-${parlay.id}`} className="block text-sm font-semibold text-slate-200">Total odds</label>
                        <input
                            id={`total-odds-${parlay.id}`}
                            name="totalOdds"
                            type="number"
                            defaultValue={parlay.total_odds ?? ""}
                            placeholder="e.g. +250"
                            required
                            className="w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>

                    {error && <p className="rounded-md border border-red-800 bg-red-950 px-3 py-2 text-sm font-medium text-red-300" role="alert">{error}</p>}

                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} disabled={isSaving} className="rounded-md bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600 disabled:opacity-50">Cancel</button>
                        <button type="submit" disabled={isSaving} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-60">
                            {isSaving ? "Saving…" : "Save results"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
