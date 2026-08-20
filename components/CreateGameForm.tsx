"use client";

import type { FormEvent } from "react";
import { createGame } from "@/app/actions/games";

export default function CreateGameForm() {
    function validateGame(event: FormEvent<HTMLFormElement>) {
        const formData = new FormData(event.currentTarget);
        const title = formData.get("title")?.toString().trim();
        const gameDate = formData.get("gameDate")?.toString();

        if (title && gameDate) {
            return;
        }

        event.preventDefault();
        window.alert("Enter both a game title and date before creating a game.");
    }

    return (
        <form
            action={createGame}
            onSubmit={validateGame}
            className="space-y-4 rounded-xl border border-slate-700 bg-slate-900 p-6 shadow"
        >
            <h2 className="text-xl font-semibold">
                Create New Game
            </h2>

            <div>
                <label htmlFor="game-title" className="block font-semibold">
                    Game Title
                </label>

                <input
                    id="game-title"
                    name="title"
                    className="w-full rounded border border-slate-600 bg-slate-800 p-2 text-slate-100"
                />
            </div>

            <div>
                <label htmlFor="game-date" className="block font-semibold">
                    Game Date
                </label>

                <input
                    id="game-date"
                    type="date"
                    name="gameDate"
                    className="w-full rounded border border-slate-600 bg-slate-800 p-2 text-slate-100"
                />
            </div>

            <p className="text-sm text-slate-400">
                Season, week, and stage are calculated automatically from the game date.
            </p>

            <button
                className="bg-blue-600 text-white px-4 py-2 rounded"
            >
                Create Game
            </button>
        </form>
    );
}
