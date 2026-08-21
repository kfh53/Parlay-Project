import { promoteGame } from "@/app/actions/parlays";
import { Parlay } from "@/lib/types";
import DeleteGameButton from "./DeleteGameButton";

export default function UpcomingGameCard({ parlay }: { parlay: Parlay }) {
    return (
        <article className="flex min-h-48 w-[min(100%,20rem)] shrink-0 snap-start flex-col justify-between rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-sm transition-colors hover:border-slate-600">
            <div>
                <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {parlay.week ? `Week ${parlay.week}` : "Upcoming"}
                    </span>
                    <div className="flex items-start gap-1">
                        <span className="mt-0.5 rounded-full border border-slate-600 bg-slate-800/70 px-2 py-0.5 text-xs font-semibold text-slate-300">
                            Scheduled
                        </span>
                        <DeleteGameButton id={parlay.id} title={parlay.title} />
                    </div>
                </div>

                <h3 className="mt-4 text-lg font-bold text-slate-100">{parlay.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{parlay.game_date}</p>
                {parlay.notes && (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-blue-300">
                        {parlay.notes}
                    </p>
                )}
            </div>

            <form action={promoteGame} className="mt-5">
                <input type="hidden" name="id" value={parlay.id} />
                <button className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900">
                    Move to current
                </button>
            </form>
        </article>
    );
}
