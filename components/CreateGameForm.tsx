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
            className="bg-white rounded-xl shadow p-6 space-y-4"
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
                    className="border rounded p-2 w-full"
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
                    className="border rounded p-2 w-full"
                />
            </div>

            <button
                className="bg-blue-600 text-white px-4 py-2 rounded"
            >
                Create Game
            </button>
        </form>
    );
}
