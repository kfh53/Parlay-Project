import { Parlay, Profile } from "@/lib/types";
import PickRow from "./PickRow";


interface PickListProps {
    parlay: Parlay;
    profiles: Profile[];
    currentUserId: string;
    showResults: boolean;
    showPickForms: boolean;
}


export default function PickList({
    parlay,
    profiles,
    currentUserId,
    showResults,
    showPickForms
}: PickListProps) {


    return (
        <div className="space-y-2">

            {profiles.map((profile) => {

                const pick = parlay.picks.find(
                    p => p.user_id === profile.id
                );


                return (
                    <PickRow
                        key={profile.id}
                        profile={profile}
                        pick={pick}
                        isCurrentUser={
                            profile.id === currentUserId
                        }
                        showResult={showResults}
                        showResultColor={parlay.status === "locked" || parlay.status === "complete"}
                        showPickForm={showPickForms}
                        parlayId={parlay.id}
                        gameTitle={parlay.title}
                    />
                );
            })}

        </div>
    );
}
