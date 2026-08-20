"use client";

import { FormEvent, useState } from "react";
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
    targetDisplayName,
    initiallyOpen = false
}: {
    parlayId: string;
    gameTitle: string;
    existingPick?: Pick;
    targetUserId?: string;
    targetDisplayName?: string;
    initiallyOpen?: boolean;
}) {

    const [open, setOpen] = useState(initiallyOpen);
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [betType, setBetType] = useState(existingPick?.bet_type ?? "");
    const fieldId = targetUserId ? `${parlayId}-${targetUserId}` : parlayId;
    const teams = matchupTeams(gameTitle);
    const selectedBetType = betType as BetType;
    const showPlayer = Boolean(betType) && betTypeNeedsPlayer(selectedBetType);
    const showTeam = Boolean(betType) && betTypeNeedsTeam(selectedBetType);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setIsSaving(true);
        const result = await savePick(new FormData(event.currentTarget));
        setIsSaving(false);

        if (result?.error) {
            setError(result.error);
            return;
        }

        setOpen(false);
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
                {existingPick ? "Edit My Pick" : "Add My Pick"}
            </button>
        );
    }


    return (

        <form
            onSubmit={handleSubmit}
            className="dark-pick-form space-y-4 rounded-lg border p-4"
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

    );
}
