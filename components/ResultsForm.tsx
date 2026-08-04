"use client";


import { updatePickResult } from "@/app/actions/results";


interface ResultFormProps {
    pickId: string;
    currentResult?: string | null;
}


export default function ResultForm({
    pickId,
    currentResult
}: ResultFormProps) {


    return (

        <form
            action={updatePickResult}
            className="flex gap-2 items-center"
        >

            <input
                type="hidden"
                name="pickId"
                value={pickId}
            />


            <select
                name="result"
                defaultValue={currentResult ?? ""}
                className="border rounded p-1"
            >

                <option value="">
                    Pending
                </option>

                <option value="win">
                    Win
                </option>

                <option value="loss">
                    Loss
                </option>

                <option value="push">
                    Push
                </option>

            </select>


            <button
                className="
                    bg-green-600
                    text-white
                    px-3
                    py-1
                    rounded
                "
            >
                Save
            </button>

        </form>

    );
}