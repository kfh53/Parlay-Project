"use client";

import { useState } from "react";
import { Parlay, Profile } from "@/lib/types";
import PickList from "./PickList";
import AddPickForm from "./AddPickForm";
import GameActions from "./GameActions";
import TotalOddsForm from "./TotalOddsForm";


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

    const missingPickNames = profiles
        .filter(profile => !parlay.picks.some(pick => pick.user_id === profile.id))
        .map(profile => profile.display_name);

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
    const completionMessage = !hasAllResults && !hasTotalOdds
        ? "Enter all pick results and total odds before completing."
        : !hasAllResults
            ? "Enter a result for every pick before completing."
            : !hasTotalOdds
                ? "Enter total odds before completing."
                : undefined;

    const resultCardStyle = hasResolvedResults
        ? isWinningParlay
            ? "border-emerald-700 bg-emerald-950/70"
            : isPushedParlay
                ? "border-amber-700 bg-amber-950/60"
                : "border-red-800 bg-red-950/70"
        : "border-slate-700 bg-slate-900";


    return (

        <article className={`w-[min(100%,26rem)] shrink-0 snap-start rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md space-y-4 ${resultCardStyle}`}>


            <div>

                <h2 className="text-xl font-bold">
                    {parlay.title}
                </h2>


                <p className="text-slate-300">
                    {parlay.game_date}
                </p>


                <p className="text-sm font-semibold mt-1 text-slate-200">
                    Status: {parlay.status}
                </p>

            </div>



            <hr />



            <PickList
                parlay={parlay}
                profiles={profiles}
                currentUserId={currentUserId}
                showResults={parlay.status === "locked" || parlay.status === "complete"}
                showResultForms={
                    parlay.status === "locked" && isEnteringResults
                }
                showPickForms={
                    parlay.status === "open" &&
                    parlay.created_by === currentUserId &&
                    isManagingAllPicks
                }
            />



            {parlay.status === "open" ? (

                <AddPickForm
                    parlayId={parlay.id}
                    gameTitle={parlay.title}
                    existingPick={myPick}
                />

            ) : (

                <div className="text-slate-400 italic">
                    Picks are locked
                </div>

            )}

            {parlay.status === "locked" && parlay.created_by === currentUserId && (
                <TotalOddsForm id={parlay.id} totalOdds={parlay.total_odds} />
            )}



            <GameActions
                status={parlay.status}
                id={parlay.id}
                canManageResults={parlay.created_by === currentUserId}
                missingPickNames={missingPickNames}
                canComplete={hasAllResults && hasTotalOdds}
                completionMessage={completionMessage}
                onManageAllPicks={() => setIsManagingAllPicks(true)}
                onEnterResults={() => setIsEnteringResults(true)}
            />


        </article>

    );
}
