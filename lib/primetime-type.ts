import { FootballStage } from "@/lib/football-calendar";

export type PrimetimeType = "MNF" | "TNF" | "SNF" | "special";

export function getPrimetimeType(
    gameDate: string,
    stage: FootballStage
): PrimetimeType {
    if (stage !== "regular") return "special";

    const day = new Date(`${gameDate}T12:00:00`).getDay();
    if (day === 1) return "MNF";
    if (day === 4) return "TNF";
    if (day === 0) return "SNF";
    return "special";
}
