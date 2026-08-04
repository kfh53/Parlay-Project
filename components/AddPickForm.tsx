"use client";

import { useState } from "react";
import { savePick } from "@/app/actions/picks";
import { Pick } from "@/lib/types";

export default function AddPickForm({
    parlayId,
    existingPick,
    targetUserId,
    targetDisplayName,
    initiallyOpen = false
}: {
    parlayId: string;
    existingPick?: Pick;
    targetUserId?: string;
    targetDisplayName?: string;
    initiallyOpen?: boolean;
}) {

    const [open, setOpen] = useState(initiallyOpen);
    const fieldId = targetUserId ? `${parlayId}-${targetUserId}` : parlayId;


    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="
                    bg-blue-600
                    text-white
                    rounded
                    px-4
                    py-2
                "
            >
                {existingPick ? "Edit My Pick" : "Add My Pick"}
            </button>
        );
    }


    return (

        <form
            action={savePick}
            className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
        >

            <input
                type="hidden"
                name="parlayId"
                value={parlayId}
            />

            {targetUserId && (
                <input
                    type="hidden"
                    name="targetUserId"
                    value={targetUserId}
                />
            )}


            <div className="space-y-1.5">
                <label
                    htmlFor={`selection-${fieldId}`}
                    className="block text-sm font-semibold text-slate-700"
                >
                    {targetDisplayName ? `${targetDisplayName}'s pick` : "Pick"}
                </label>

                <input
                    id={`selection-${fieldId}`}
                    name="selection"
                    defaultValue={existingPick?.selection}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
            </div>

            <div className="space-y-1.5">
                <label
                    htmlFor={`odds-${fieldId}`}
                    className="block text-sm font-semibold text-slate-700"
                >
                    Odds
                </label>

                <input
                    id={`odds-${fieldId}`}
                    type="number"
                    name="odds"
                    defaultValue={existingPick?.odds}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
            </div>

            <div className="space-x-2">

                <button
                    type="submit"
                    className="
                        bg-green-600
                        text-white
                        rounded
                        px-4
                        py-2
                    "
                >
                    Save Pick
                </button>


                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="
                        bg-gray-300
                        rounded
                        px-4
                        py-2
                    "
                >
                    Cancel
                </button>

            </div>


        </form>

    );
}
