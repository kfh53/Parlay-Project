"use client";

import { useState } from "react";
import { Parlay, Profile } from "@/lib/types";
import PickList from "./PickList";
import AddPickForm from "./AddPickForm";
import GameActions from "./GameActions";
import DeleteGameButton from "./DeleteGameButton";
import LockPickButton from "./LockPickButton";
import GameResultsForm from "./GameResultsForm";


interface GameCardProps {
    parlay: Parlay;
    profiles: Profile[];
    currentUserId: string;
}


export default function GameCard({
    parlay,
    profiles,
    currentUserId
}: GameCardProps) {

    const [isEnteringResults, setIsEnteringResults] = useState(false);
    const [isManagingAllPicks, setIsManagingAllPicks] = useState(false);


    const myPick = parlay.picks.find(
        pick => pick.user_id === currentUserId
    );

    const hasResolvedResults =
        parlay.status === "complete" &&
        parlay.picks.length > 0 &&
        parlay.picks.every(pick => Boolean(pick.result));

    const isWinningParlay =
        hasResolvedResults &&
        parlay.picks.some(pick => pick.result === "win") &&
        !parlay.picks.some(pick => pick.result === "loss");

    const isPushedParlay =
        hasResolvedResults &&
        parlay.picks.every(pick => pick.result === "push");

    const hasAllResults =
        parlay.picks.length > 0 &&
        parlay.picks.every(pick => Boolean(pick.result));
    const hasTotalOdds = parlay.total_odds !== null && parlay.total_odds !== undefined;
    const lockedPickCount = parlay.picks.filter(pick => pick.is_locked).length;
    const completionMessage = !hasAllResults && !hasTotalOdds
        ? "Enter all pick results and total odds before completing."
        : !hasAllResults
            ? "Enter a result for every pick before completing."
            : !hasTotalOdds
                ? "Enter total odds before completing."
                : undefined;

    const outcome = hasResolvedResults
        ? isWinningParlay
            ? {
                card: "border-l-emerald-500",
                badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
                icon: "✓",
                label: "Win"
            }
            : isPushedParlay
                ? {
                    card: "border-l-amber-400",
                    badge: "border-amber-400/30 bg-amber-400/10 text-amber-200",
                    icon: "—",
                    label: "Push"
                }
                : {
                    card: "border-l-rose-500",
                    badge: "border-rose-500/30 bg-rose-500/10 text-rose-300",
                    icon: "×",
                    label: "Loss"
                }
        : null;


    return (

        <article className={`w-[min(100%,26rem)] shrink-0 snap-start space-y-4 rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-sm transition-all hover:border-slate-600 hover:shadow-md ${outcome ? `border-l-4 ${outcome.card}` : ""}`}>


            <div className="flex items-start justify-between gap-4">

                <div className="min-w-0">

                <h2 className="text-xl font-bold text-slate-100">
                    {parlay.title}
                </h2>


                <p className="mt-1 text-sm text-slate-400">
                    {parlay.game_date}
                </p>

                <p className="mt-1 min-h-4 text-xs font-semibold uppercase tracking-wider text-blue-300">
                    {parlay.notes ?? ""}
                </p>

                {hasTotalOdds && (
                    <p className="mt-1 text-sm font-semibold text-slate-200">
                        Total odds: {parlay.total_odds! > 0 ? "+" : ""}{parlay.total_odds}
                    </p>
                )}


                <p className="mt-1 text-sm font-medium capitalize text-slate-300">
                    Status: {parlay.status}
                </p>

                </div>

                <div className="flex shrink-0 items-start gap-1">
                    {outcome && (
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${outcome.badge}`}>
                            <span aria-hidden="true">{outcome.icon}</span>
                            {outcome.label}
                        </span>
                    )}
                    <DeleteGameButton id={parlay.id} title={parlay.title} />
                </div>

            </div>



            <hr className="border-slate-700" />

            {parlay.status === "open" && (
                <div className="space-y-2" aria-label={`${lockedPickCount} of ${profiles.length} picks locked`}>
                    <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-slate-400">Locked picks</span>
                        <span className="text-slate-300">{lockedPickCount} of {profiles.length}</span>
                    </div>
                    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.max(profiles.length, 1)}, minmax(0, 1fr))` }}>
                        {profiles.map(profile => {
                            const isLocked = parlay.picks.some(pick => pick.user_id === profile.id && pick.is_locked);
                            return (
                                <span
                                    key={profile.id}
                                    title={`${profile.display_name}: ${isLocked ? "Locked" : "Not locked"}`}
                                    className={`h-1.5 rounded-full ${isLocked ? "bg-amber-400" : "bg-slate-700"}`}
                                />
                            );
                        })}
                    </div>
                </div>
            )}



            <PickList
                parlay={parlay}
                profiles={profiles}
                currentUserId={currentUserId}
                showResults={parlay.status === "locked" || parlay.status === "complete"}
                showPickForms={
                    parlay.status === "open" &&
                    parlay.created_by === currentUserId &&
                    isManagingAllPicks
                }
            />



            {parlay.status === "open" ? (

                myPick?.is_locked ? (
                    <div className="flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-sm font-semibold text-amber-200">
                        <span aria-hidden="true">●</span>
                        Your pick is locked
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        <AddPickForm
                            parlayId={parlay.id}
                            gameTitle={parlay.title}
                            existingPick={myPick}
                        />
                        {myPick && <LockPickButton pickId={myPick.id} />}
                    </div>
                )

            ) : (

                <div className="text-slate-400 italic">
                    Picks are locked
                </div>

            )}

            <GameActions
                status={parlay.status}
                id={parlay.id}
                canManageResults={parlay.created_by === currentUserId}
                canComplete={hasAllResults && hasTotalOdds}
                completionMessage={completionMessage}
                onManageAllPicks={() => setIsManagingAllPicks(true)}
                onEnterResults={() => setIsEnteringResults(true)}
            />

            {isEnteringResults && (
                <GameResultsForm
                    parlay={parlay}
                    profiles={profiles}
                    onClose={() => setIsEnteringResults(false)}
                />
            )}


        </article>

    );
}
