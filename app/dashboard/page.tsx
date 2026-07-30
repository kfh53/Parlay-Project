import { getSupabaseServerClient } from "@/lib/supabase-server";
import { createGame } from "../actions/games";

export default async function Dashboard() {

    const supabase = await getSupabaseServerClient();

    const {
        data: parlays,
        error
    } = await supabase
        .from("parlays")
        .select("*");


    return (
        <main className="space-y-6">

            <h1 className="text-2xl font-bold">
                Open Games
            </h1>

            {/* Add Game Form */}
            <form
                action={createGame}
                className="bg-white rounded-xl shadow p-6 space-y-4"
            >
                <div>
                    <label className="block font-semibold">
                        Game Title
                    </label>

                    <input
                        name="title"
                        className="border rounded p-2 w-full"
                    />
                </div>

                <div>
                    <label className="block font-semibold">
                        Game Date
                    </label>

                    <input
                        type="date"
                        name="gameDate"
                        className="border rounded p-2 w-full"
                    />
                </div>

                <button
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    Create Game
                </button>

            </form>

            {/* Existing game list */}

            {parlays?.map((parlay) => (

                <div
                    key={parlay.id}
                    className="bg-white rounded-xl shadow p-6"
                >
                    <h2 className="text-xl font-bold">
                        {parlay.title}
                    </h2>

                    <p>{parlay.game_date}</p>

                </div>

            ))}

        </main>
    );
}