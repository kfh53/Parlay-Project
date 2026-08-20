import { Pick, Profile } from "@/lib/types";
import ResultsForm from "./ResultsForm";
import AddPickForm from "./AddPickForm";

interface PickRowProps {
    profile: Profile;
    pick?: Pick;
    isCurrentUser: boolean;
    showResult: boolean;
    showResultForm: boolean;
    showResultColor: boolean;
    showPickForm: boolean;
    parlayId: string;
    gameTitle: string;
}

export default function PickRow({
    profile,
    pick,
    isCurrentUser,
    showResult,
    showResultForm,
    showResultColor,
    showPickForm,
    parlayId,
    gameTitle
}: PickRowProps) {

    const pickResultStyle = showResultColor && pick?.result === "win"
        ? "border border-emerald-700 bg-emerald-950/60"
        : showResultColor && pick?.result === "push"
            ? "border border-yellow-700 bg-yellow-950/60"
        : showResultColor && pick?.result
            ? "border border-red-800 bg-red-950/60"
            : isCurrentUser
                ? "border border-blue-800 bg-blue-950/50"
                : "";

    return (
        <div
            className={`
                space-y-2
                rounded
                p-2
                ${pickResultStyle}
            `}
        >

            <div className="flex justify-between gap-4">
                <span className="font-medium">
                    {profile.display_name}

                    {isCurrentUser && (
                        <span className="text-blue-600 ml-2 text-sm">
                            (You)
                        </span>
                    )}
                </span>

                <span>
                    {pick
                        ? `${pick.selection} (${pick.odds > 0 ? "+" : ""}${pick.odds})`
                        : "Waiting..."
                    }
                </span>
            </div>

            {pick && showResult && !showResultForm && (
                <p className="text-sm text-slate-300">
                    Result: {pick.result ?? "Pending"}
                </p>
            )}

            {pick && showResultForm && (
                <ResultsForm
                    pickId={pick.id}
                    currentResult={pick.result}
                />
            )}

            {showPickForm && (
                <AddPickForm
                    parlayId={parlayId}
                    gameTitle={gameTitle}
                    existingPick={pick}
                    targetUserId={profile.id}
                    targetDisplayName={profile.display_name}
                />
            )}
        </div>
    );
}
