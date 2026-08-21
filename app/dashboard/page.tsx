import { getSupabaseServerClient } from "@/lib/supabase-server";
import GameCard from "@/components/GameCard";
import CreateGameForm from "@/components/CreateGameForm";
import { ensurePrimeTimeGames } from "@/app/actions/games";

export default async function Dashboard() {

    await ensurePrimeTimeGames();

    const supabase = await getSupabaseServerClient();


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


    const openGames =
        parlays?.filter(
            p => p.status === "open"
        ) ?? [];


    const lockedGames =
        parlays?.filter(
            p => p.status === "locked"
        ) ?? [];


    const completedGames =
        parlays?.filter(
            p => p.status === "complete"
        ).sort(
            (a, b) => b.game_date.localeCompare(a.game_date)
        ) ?? [];


    const {
        data: { user }
    } = await supabase.auth.getUser();



    return (

        <main className="space-y-10">


            <div className="space-y-2">

            <h1 className="text-3xl font-bold tracking-tight text-slate-100">
                Dashboard
            </h1>
            </div>



            {/* OPEN GAMES */}

            <section className="space-y-4">

                <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">
                        Open Games
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                        Announced 2026 prime-time games and custom matchups
                    </p>
                </div>
                <span className="rounded-full bg-blue-950 px-3 py-1 text-sm font-semibold text-blue-300">
                    {openGames.length}
                </span>
                </div>


                    <div className="flex snap-x snap-mandatory items-center gap-5 overflow-x-auto pb-3 pr-4">
                        <CreateGameForm />

                        {openGames.map((parlay) => (

                            <GameCard
                                key={parlay.id}
                                parlay={parlay}
                                profiles={profiles ?? []}
                                currentUserId={user?.id ?? ""}
                            />

                        ))}
                    </div>


            </section>





            {/* LOCKED GAMES */}

            <section className="space-y-4">

                <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-100">
                    Locked Games
                </h2>
                <span className="rounded-full bg-amber-950 px-3 py-1 text-sm font-semibold text-amber-300">
                    {lockedGames.length}
                </span>
                </div>


                {lockedGames.length === 0 && (
                    <p className="text-slate-500">
                        No locked games
                    </p>
                )}


                {lockedGames.length > 0 && (
                    <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3 pr-4">
                        {lockedGames.map((parlay) => (

                            <GameCard
                                key={parlay.id}
                                parlay={parlay}
                                profiles={profiles ?? []}
                                currentUserId={user?.id ?? ""}
                            />

                        ))}
                    </div>
                )}


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
                                currentUserId={user?.id ?? ""}
                            />

                        ))}
                    </div>
                )}


            </section>


        </main>

    );
}
