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

    const resultCardStyle = hasResolvedResults
        ? isWinningParlay
            ? "border-emerald-400 bg-emerald-200"
            : isPushedParlay
                ? "border-amber-400 bg-amber-100"
                : "border-red-400 bg-red-200"
        : "border-slate-200 bg-white";


    return (

        <article className={`w-[min(100%,26rem)] shrink-0 snap-start rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md space-y-4 ${resultCardStyle}`}>


            <div>

                <h2 className="text-xl font-bold">
                    {parlay.title}
                </h2>


                <p className="text-slate-700">
                    {parlay.game_date}
                </p>


                <p className="text-sm font-semibold mt-1 text-slate-800">
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

                <div className="text-slate-700 italic">
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
                onManageAllPicks={() => setIsManagingAllPicks(true)}
                onEnterResults={() => setIsEnteringResults(true)}
            />


        </article>

    );
}
