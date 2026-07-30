export default function NewPickPage() {

    return (
        <main>

            <h1>
                Submit Parlay Pick
            </h1>


            <form>

                <label>
                    Pick
                </label>

                <input
                    placeholder="Example: Chiefs ML"
                />


                <label>
                    Odds
                </label>

                <input
                    placeholder="+120"
                />


                <button>
                    Submit Pick
                </button>


            </form>

        </main>
    );
}