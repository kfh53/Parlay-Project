"use client";

import type { FormEvent } from "react";
import { completeGame, lockGame } from "@/app/actions/parlays";


interface GameActionsProps {
    status: string;
    id: string;
    canManageResults: boolean;
    missingPickNames: string[];
    canComplete: boolean;
    completionMessage?: string;
    onManageAllPicks: () => void;
    onEnterResults: () => void;
}


export default function GameActions({
    status,
    id,
    canManageResults,
    missingPickNames,
    canComplete,
    completionMessage,
    onManageAllPicks,
    onEnterResults
}: GameActionsProps) {

    function confirmLock(event: FormEvent<HTMLFormElement>) {
        if (missingPickNames.length === 0) {
            return;
        }

        const people = missingPickNames.join(", ");
        const shouldLock = window.confirm(
            `This game is still missing picks from ${people}. Lock it anyway?`
        );

        if (!shouldLock) {
            event.preventDefault();
        }
    }


    return (
        <div className="flex flex-wrap gap-2">


            {status === "open" && (

                <>

                <form action={lockGame} onSubmit={confirmLock}>

                    <input
                        type="hidden"
                        name="id"
                        value={id}
                    />

                    <button
                        className="
                            bg-yellow-500
                            text-white
                            rounded
                            px-4
                            py-2
                        "
                    >
                        Lock Game
                    </button>

                </form>

                {canManageResults && (
                    <button
                        type="button"
                        onClick={onManageAllPicks}
                        className="rounded bg-slate-700 px-4 py-2 text-white"
                    >
                        Manage All Picks
                    </button>
                )}

                </>

            )}



            {status === "locked" && canManageResults && (

                <>

                <button
                    type="button"
                    onClick={onEnterResults}
                    className="
                        bg-green-600
                        text-white
                        rounded
                        px-4
                        py-2
                    "
                >
                    Enter Results
                </button>

                <form action={completeGame}>

                    <input
                        type="hidden"
                        name="id"
                        value={id}
                    />

                    <button
                        disabled={!canComplete}
                        title={!canComplete ? completionMessage : undefined}
                        className="
                            bg-blue-600
                            text-white
                            rounded
                            px-4
                            py-2
                            disabled:cursor-not-allowed
                            disabled:bg-slate-700
                            disabled:text-slate-400
                        "
                    >
                        Complete Game
                    </button>

                </form>

                {!canComplete && completionMessage && (
                    <p className="basis-full text-sm text-amber-300" role="status">
                        {completionMessage}
                    </p>
                )}

                </>

            )}


        </div>
    );
}
