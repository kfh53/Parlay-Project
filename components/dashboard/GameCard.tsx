interface Pick {
    user: string;
    selection: string;
    odds: number;
}


interface GameCardProps {
    title: string;
    date: string;
    picks: Pick[];
}


export default function GameCard({
    title,
    date,
    picks
}: GameCardProps) {

    return (

        <div className="
            bg-white
            rounded-xl
            shadow
            p-6
            space-y-4
        ">

            <div>
                <h2 className="text-lg font-bold">
                    {title}
                </h2>

                <p className="text-gray-500">
                    {date}
                </p>
            </div>


            <div className="space-y-2">

                {picks.map((pick) => (

                    <div
                        key={pick.user}
                        className="
                            flex
                            justify-between
                            border-b
                            pb-2
                        "
                    >

                        <span>
                            {pick.user}
                        </span>


                        <span>
                            {pick.selection}
                            ({pick.odds})
                        </span>

                    </div>

                ))}

            </div>


            <button
                className="
                    w-full
                    rounded-lg
                    bg-black
                    text-white
                    p-2
                "
            >
                Add My Pick
            </button>

        </div>
    );
}