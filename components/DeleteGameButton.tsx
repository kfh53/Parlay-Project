"use client";

import type { FormEvent } from "react";
import { deleteGame } from "@/app/actions/parlays";

export default function DeleteGameButton({ id, title }: { id: string; title: string }) {
    function confirmDelete(event: FormEvent<HTMLFormElement>) {
        const shouldDelete = window.confirm(
            `Delete ${title}? This will also remove every pick attached to this game.`
        );

        if (!shouldDelete) event.preventDefault();
    }

    return (
        <form action={deleteGame} onSubmit={confirmDelete}>
            <input type="hidden" name="id" value={id} />
            <button
                type="submit"
                aria-label={`Delete ${title}`}
                title="Delete game"
                className="grid size-8 place-items-center rounded-md border border-transparent text-xl leading-none text-slate-500 transition-colors hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            >
                &times;
            </button>
        </form>
    );
}
