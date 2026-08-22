import { getSupabaseServerClient } from "@/lib/supabase-server";
import GameCard from "@/components/GameCard";
import CreateGameForm from "@/components/CreateGameForm";
import { ensurePrimeTimeGames } from "@/app/actions/games";
import UpcomingGameCard from "@/components/UpcomingGameCard";
import { redirect } from "next/navigation";

export default async function Dashboard() {
    const supabase = await getSupabaseServerClient();
    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) redirect("/login");

    await ensurePrimeTimeGames();


    const [{ data: parlays, error }, { data: profiles }] =
        await Promise.all([

            supabase
                .from("parlays")
                .select(`
                    *,
                    picks (
                        id,
                        user_id,
                        selection,
                        player_name,
                        bet_type,
                        team_name,
                        odds,
                        is_locked,
                        result
                    )
                `)
                .order("game_date", { ascending: true }),


            supabase
                .from("profiles")
                .select("id, display_name")
                .order("display_name")

        ]);


    if (error) {
        console.error("Error loading parlays:", error);
    }


    const upcomingGames =
        parlays?.filter(
            p => p.status === "upcoming"
        ) ?? [];


    const currentGames =
        parlays?.filter(
            p => p.status === "open" || p.status === "locked"
        ) ?? [];


    const completedGames = parlays
        ?.filter(p => p.status === "complete")
        .sort((a, b) => b.game_date.localeCompare(a.game_date)) ?? [];

    return (

        <main className="space-y-10">


            {/* CURRENT GAMES */}

            <section className="space-y-4">

                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-100">Current Games</h2>
                    </div>
                    <span className="rounded-full bg-blue-950 px-3 py-1 text-sm font-semibold text-blue-300">
                        {currentGames.length}
                    </span>
                </div>

                {currentGames.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-10 text-center">
                        <p className="font-medium text-slate-300">No current games</p>
                        <p className="mt-1 text-sm text-slate-500">Move an upcoming matchup here when you are ready to make picks.</p>
                    </div>
                ) : (
                    <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3 pr-4">
                        {currentGames.map((parlay) => (

                            <GameCard
                                key={parlay.id}
                                parlay={parlay}
                                profiles={profiles ?? []}
                                currentUserId={user.id}
                            />

                        ))}
                    </div>
                )}


            </section>





            {/* UPCOMING GAMES */}

            <section className="space-y-4">

                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-100">Upcoming Games</h2>
                    </div>
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-sm font-semibold text-slate-300">
                        {upcomingGames.length}
                    </span>
                </div>

                <div className="flex snap-x snap-mandatory items-center gap-5 overflow-x-auto pb-3 pr-4">
                    <CreateGameForm />
                    {upcomingGames.map(parlay => (
                        <UpcomingGameCard key={parlay.id} parlay={parlay} />
                    ))}
                </div>


            </section>





            {/* COMPLETED GAMES */}

            <section className="space-y-4">

                <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-100">
                    Completed Games
                </h2>
                <span className="rounded-full bg-emerald-950 px-3 py-1 text-sm font-semibold text-emerald-300">
                    {completedGames.length}
                </span>
                </div>


                {completedGames.length === 0 && (
                    <p className="text-slate-500">
                        No completed games
                    </p>
                )}


                {completedGames.length > 0 && (
                    <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3 pr-4">
                        {completedGames.map((parlay) => (

                            <GameCard
                                key={parlay.id}
                                parlay={parlay}
                                profiles={profiles ?? []}
                                currentUserId={user.id}
                            />

                        ))}
                    </div>
                )}


            </section>


        </main>

    );
}
