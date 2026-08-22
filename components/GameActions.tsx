"use client";

import { completeGame } from "@/app/actions/parlays";


interface GameActionsProps {
    status: string;
    id: string;
    canManageResults: boolean;
    canComplete: boolean;
    completionMessage?: string;
    // onManageAllPicks: () => void;
    onEnterResults: () => void;
}


export default function GameActions({
    status,
    id,
    canManageResults,
    canComplete,
    completionMessage,
    // onManageAllPicks,
    onEnterResults
}: GameActionsProps) {

    return (
        <div className="flex flex-wrap gap-2">


            {/* Manage All Picks is temporarily disabled while each user manages their own pick.
            {status === "open" && canManageResults && (
                <button
                    type="button"
                    onClick={onManageAllPicks}
                    className="rounded bg-slate-700 px-4 py-2 text-white"
                >
                    Manage All Picks
                </button>
            )} */}



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
