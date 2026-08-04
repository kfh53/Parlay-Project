"use client";

import type { FormEvent } from "react";
import { completeGame, lockGame } from "@/app/actions/parlays";


interface GameActionsProps {
    status: string;
    id: string;
    canManageResults: boolean;
    missingPickNames: string[];
    onManageAllPicks: () => void;
    onEnterResults: () => void;
}


export default function GameActions({
    status,
    id,
    canManageResults,
    missingPickNames,
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
        <div className="flex gap-2">


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
                        className="
                            bg-blue-600
                            text-white
                            rounded
                            px-4
                            py-2
                        "
                    >
                        Complete Game
                    </button>

                </form>

                </>

            )}


        </div>
    );
}
