"use client";

import type { FormEvent } from "react";
import { lockPick } from "@/app/actions/picks";

export default function LockPickButton({
    pickId,
    label = "Lock my pick"
}: {
    pickId: string;
    label?: string;
}) {
    function confirmLock(event: FormEvent<HTMLFormElement>) {
        const shouldLock = window.confirm(
            "Lock this pick? You will not be able to edit it afterward."
        );

        if (!shouldLock) event.preventDefault();
    }

    return (
        <form action={lockPick} onSubmit={confirmLock}>
            <input type="hidden" name="pickId" value={pickId} />
            <button className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200 transition-colors hover:bg-amber-500/20">
                {label}
            </button>
        </form>
    );
}
