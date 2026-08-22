"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { savePick } from "@/app/actions/picks";
import { Pick } from "@/lib/types";
import {
    BET_TYPE_OPTIONS,
    BetType,
    betTypeNeedsPlayer,
    betTypeNeedsTeam,
    matchupTeams
} from "@/lib/pick-fields";

export default function AddPickForm({
    parlayId,
    gameTitle,
    existingPick,
    targetUserId,
    targetDisplayName
}: {
    parlayId: string;
    gameTitle: string;
    existingPick?: Pick;
    targetUserId?: string;
    targetDisplayName?: string;
}) {

    const [open, setOpen] = useState(false);
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [betType, setBetType] = useState(existingPick?.bet_type ?? "");
    const dialogRef = useRef<HTMLDivElement>(null);
    const fieldId = targetUserId ? `${parlayId}-${targetUserId}` : parlayId;
    const teams = matchupTeams(gameTitle);
    const selectedBetType = betType as BetType;
    const showPlayer = Boolean(betType) && betTypeNeedsPlayer(selectedBetType);
    const showTeam = Boolean(betType) && betTypeNeedsTeam(selectedBetType);

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
        setError("");
        setIsSaving(true);
        const formData = new FormData(event.currentTarget);

        try {
            const result = await savePick(formData);

            if (result?.error) {
                setError(result.error);
                return;
            }

            setOpen(false);
        } catch (submitError) {
            console.error("Unable to save pick:", submitError);
            setError("Unable to save your pick. Refresh the page, sign in again, and retry.");
        } finally {
            setIsSaving(false);
        }
    }


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
                {existingPick
                    ? targetDisplayName ? `Edit ${targetDisplayName}'s Pick` : "Edit My Pick"
                    : targetDisplayName ? `Add ${targetDisplayName}'s Pick` : "Add My Pick"}
            </button>
        );
    }


    return (

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
                aria-labelledby={`pick-form-title-${fieldId}`}
                tabIndex={-1}
                className="w-full max-w-lg outline-none"
            >
            <form
                onSubmit={handleSubmit}
                className="dark-pick-form max-h-[calc(100vh-2rem)] space-y-4 overflow-y-auto rounded-xl border p-5 shadow-2xl"
            >

            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 id={`pick-form-title-${fieldId}`} className="text-xl font-bold text-slate-100">
                        {existingPick ? "Edit pick" : "Add a pick"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">{gameTitle}</p>
                </div>
                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={isSaving}
                    aria-label="Close pick form"
                    className="rounded-md px-2 py-1 text-2xl leading-none text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-50"
                >
                    &times;
                </button>
            </div>

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
                    htmlFor={`bet-type-${fieldId}`}
                    className="block text-sm font-semibold text-slate-700"
                >
                    Type of bet
                </label>

                <select
                    id={`bet-type-${fieldId}`}
                    name="betType"
                    value={betType}
                    onChange={event => setBetType(event.target.value)}
                    required
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                    <option value="">Select a bet type</option>
                    {BET_TYPE_OPTIONS.map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
            </div>

            {showPlayer && (
                <div className="space-y-1.5">
                    <label
                        htmlFor={`player-name-${fieldId}`}
                        className="block text-sm font-semibold text-slate-700"
                    >
                        Player bet on
                    </label>
                    <input
                        id={`player-name-${fieldId}`}
                        name="playerName"
                        defaultValue={existingPick?.player_name ?? ""}
                        required
                        placeholder="Josh Allen"
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                </div>
            )}

            {showTeam && (
                <div className="space-y-1.5">
                    <label
                        htmlFor={`team-name-${fieldId}`}
                        className="block text-sm font-semibold text-slate-700"
                    >
                        Team bet on
                    </label>
                    {teams.length ? (
                        <select
                            id={`team-name-${fieldId}`}
                            name="teamName"
                            defaultValue={existingPick?.team_name ?? ""}
                            required
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="">Select a team</option>
                            {teams.map(team => <option key={team} value={team}>{team}</option>)}
                        </select>
                    ) : (
                        <input
                            id={`team-name-${fieldId}`}
                            name="teamName"
                            defaultValue={existingPick?.team_name ?? ""}
                            required
                            placeholder="BUF"
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 uppercase text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    )}
                </div>
            )}

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

                {error && (
                    <p className="mb-3 rounded-md border border-red-800 bg-red-950 px-3 py-2 text-sm font-medium text-red-300" role="alert">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={isSaving}
                    className="
                        bg-green-600
                        text-white
                        rounded
                        px-4
                        py-2
                    "
                >
                    {isSaving ? "Saving…" : "Save Pick"}
                </button>


                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={isSaving}
                    className="
                        bg-slate-600
                        text-white
                        rounded
                        px-4
                        py-2
                    "
                >
                    Cancel
                </button>

            </div>


            </form>
            </div>
        </div>

    );
}
