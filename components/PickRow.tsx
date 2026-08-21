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

    const outcome = showResultColor && pick?.result
        ? pick.result === "win"
            ? {
                row: "border-l-emerald-500",
                badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
                icon: "✓",
                label: "Win"
            }
            : pick.result === "push"
                ? {
                    row: "border-l-amber-400",
                    badge: "border-amber-400/30 bg-amber-400/10 text-amber-200",
                    icon: "—",
                    label: "Push"
                }
                : {
                    row: "border-l-rose-500",
                    badge: "border-rose-500/30 bg-rose-500/10 text-rose-300",
                    icon: "×",
                    label: "Loss"
                }
        : null;

    const pickRowStyle = outcome
        ? `border-l-2 ${outcome.row}`
        : isCurrentUser
            ? "border-blue-500/40 bg-blue-500/5"
            : "";

    return (
        <div
            className={`
                space-y-2
                rounded-md
                border border-slate-700/70
                bg-slate-950/25
                p-3
                ${pickRowStyle}
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

                <span className="text-right text-slate-200">
                    {pick
                        ? `${pick.selection} (${pick.odds > 0 ? "+" : ""}${pick.odds})`
                        : "Waiting..."
                    }
                </span>
            </div>

            {pick && showResult && !showResultForm && (
                outcome ? (
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${outcome.badge}`}>
                        <span aria-hidden="true">{outcome.icon}</span>
                        {outcome.label}
                    </span>
                ) : (
                    <span className="inline-flex rounded-full border border-slate-600 bg-slate-800/60 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-300">
                        Pending
                    </span>
                )
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
