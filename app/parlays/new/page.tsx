export default function NewParlayPage() {

    return (
        <main>
            <h1>Create Open Game</h1>

            <form>

                <label>
                    Game Name
                </label>

                <input
                    placeholder="Example: Chiefs vs Bills"
                />


                <label>
                    Game Date
                </label>

                <input
                    type="date"
                />


                <button>
                    Create
                </button>

            </form>

        </main>
    );
}