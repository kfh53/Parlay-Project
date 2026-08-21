"use client";

import type { FormEvent } from "react";
import { createGame } from "@/app/actions/games";

export default function CreateGameForm() {
    function validateGame(event: FormEvent<HTMLFormElement>) {
        const formData = new FormData(event.currentTarget);
        const title = formData.get("title")?.toString().trim();
        const gameDate = formData.get("gameDate")?.toString();

        if (title && gameDate) return;

        event.preventDefault();
        window.alert("Enter both a matchup and date before creating a game.");
    }

    return (
        <details className="group w-[min(100%,20rem)] shrink-0 snap-start overflow-hidden rounded-xl border border-dashed border-slate-600 bg-slate-900/60 transition-colors open:border-solid open:border-blue-500/50 open:bg-slate-900 hover:border-slate-500">
            <summary className="flex min-h-44 cursor-pointer list-none flex-col items-center justify-center gap-3 p-5 text-center marker:hidden">
                <span className="grid size-11 place-items-center rounded-full border border-blue-400/30 bg-blue-500/10 text-2xl font-light text-blue-300 transition-transform group-open:rotate-45">
                    +
                </span>
                <span>
                    <span className="block font-semibold text-slate-100">Add another game</span>
                    <span className="mt-1 block text-sm text-slate-400">Create a custom matchup</span>
                </span>
            </summary>

            <form action={createGame} onSubmit={validateGame} className="space-y-4 border-t border-slate-700 p-5">
                <div>
                    <label htmlFor="game-title" className="mb-1.5 block text-sm font-medium text-slate-300">
                        Matchup
                    </label>
                    <input
                        id="game-title"
                        name="title"
                        placeholder="Ravens at Steelers"
                        className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>

                <div>
                    <label htmlFor="game-date" className="mb-1.5 block text-sm font-medium text-slate-300">
                        Game date
                    </label>
                    <input
                        id="game-date"
                        type="date"
                        name="gameDate"
                        className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>

                <button className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900">
                    Create game
                </button>
            </form>
        </details>
    );
}
