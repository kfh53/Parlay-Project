import { getSupabaseServerClient } from "@/lib/supabase-server";
import GameCard from "@/components/GameCard";
import CreateGameForm from "@/components/CreateGameForm";

export default async function Dashboard() {

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
        ) ?? [];


    const {
        data: { user }
    } = await supabase.auth.getUser();



    return (

        <main className="space-y-10">


            <div className="space-y-2">

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Parlay Dashboard
            </h1>
            </div>



            {/* Add Game Form */}

            <CreateGameForm />




            {/* OPEN GAMES */}

            <section className="space-y-4">

                <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-900">
                    Open Games
                </h2>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                    {openGames.length}
                </span>
                </div>


                {openGames.length === 0 && (
                    <p className="text-gray-500">
                        No open games
                    </p>
                )}


                {openGames.length > 0 && (
                    <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3 pr-4">
                        {openGames.map((parlay) => (

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





            {/* LOCKED GAMES */}

            <section className="space-y-4">

                <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-900">
                    Locked Games
                </h2>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                    {lockedGames.length}
                </span>
                </div>


                {lockedGames.length === 0 && (
                    <p className="text-gray-500">
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
                <h2 className="text-2xl font-bold text-slate-900">
                    Completed Games
                </h2>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                    {completedGames.length}
                </span>
                </div>


                {completedGames.length === 0 && (
                    <p className="text-gray-500">
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
