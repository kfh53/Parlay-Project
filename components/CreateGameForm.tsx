"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { createGame } from "@/app/actions/games";

export default function CreateGameForm() {
    const [open, setOpen] = useState(false);
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        dialogRef.current?.focus();

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape" && !isSaving) setOpen(false);
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, isSaving]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const title = formData.get("title")?.toString().trim();
        const gameDate = formData.get("gameDate")?.toString();

        if (!title || !gameDate) {
            setError("Enter both a matchup and date before creating a game.");
            return;
        }

        setError("");
        setIsSaving(true);

        try {
            await createGame(formData);
            setOpen(false);
        } catch {
            setError("The game could not be created. Please try again.");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="group flex min-h-48 w-[min(100%,20rem)] shrink-0 snap-start flex-col items-center justify-center gap-3 self-center rounded-xl border border-dashed border-slate-600 bg-slate-900/60 p-6 text-center transition-all hover:border-blue-500/60 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
                <span className="grid size-11 place-items-center rounded-full border border-blue-400/30 bg-blue-500/10 text-2xl font-light text-blue-300 transition-transform group-hover:scale-105">
                    +
                </span>
                <span>
                    <span className="block font-semibold text-slate-100">Add another game</span>
                    <span className="mt-1 block text-sm text-slate-400">Create a custom matchup</span>
                </span>
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
                    onMouseDown={event => {
                        if (event.target === event.currentTarget && !isSaving) setOpen(false);
                    }}
                >
                    <div
                        ref={dialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="game-form-title"
                        tabIndex={-1}
                        className="w-full max-w-lg outline-none"
                    >
                        <form onSubmit={handleSubmit} className="dark-pick-form max-h-[calc(100vh-2rem)] space-y-5 overflow-y-auto rounded-xl border p-5 shadow-2xl">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 id="game-form-title" className="text-xl font-bold text-slate-100">Add a game</h2>
                                    <p className="mt-1 text-sm text-slate-400">Create a custom matchup for the group.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    disabled={isSaving}
                                    aria-label="Close game form"
                                    className="rounded-md px-2 py-1 text-2xl leading-none text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-50"
                                >
                                    &times;
                                </button>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="game-title" className="block text-sm font-semibold text-slate-200">Matchup</label>
                                <input
                                    id="game-title"
                                    name="title"
                                    required
                                    placeholder="BAL vs PIT"
                                    className="w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="game-date" className="block text-sm font-semibold text-slate-200">Game date</label>
                                <input
                                    id="game-date"
                                    type="date"
                                    name="gameDate"
                                    required
                                    className="w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-baseline justify-between gap-3">
                                    <label htmlFor="game-notes" className="block text-sm font-semibold text-slate-200">Notes</label>
                                    <span className="text-xs text-slate-500">Optional</span>
                                </div>
                                <textarea
                                    id="game-notes"
                                    name="notes"
                                    rows={3}
                                    placeholder="SNF * 8:20 ET * WEEK 1"
                                    className="w-full resize-none rounded-md border border-slate-600 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            {error && (
                                <p className="rounded-md border border-red-800 bg-red-950 px-3 py-2 text-sm font-medium text-red-300" role="alert">
                                    {error}
                                </p>
                            )}

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    disabled={isSaving}
                                    className="rounded-md bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60"
                                >
                                    {isSaving ? "Creating…" : "Create game"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
