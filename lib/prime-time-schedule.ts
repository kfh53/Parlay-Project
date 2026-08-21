export type PrimeTimeGame = {
    title: string;
    gameDate: string;
    week: number;
    window: "TNF" | "SNF" | "MNF";
    time: string;
};

// Announced 2026 national prime-time package games. Late-season flexible
// slots without an announced matchup are intentionally omitted.
export const PRIME_TIME_GAMES_2026: PrimeTimeGame[] = [
    { title: "Patriots at Seahawks", gameDate: "2026-09-09", week: 1, window: "SNF", time: "8:20 PM ET" },
    { title: "49ers at Rams", gameDate: "2026-09-10", week: 1, window: "TNF", time: "8:35 PM ET" },
    { title: "Cowboys at Giants", gameDate: "2026-09-13", week: 1, window: "SNF", time: "8:20 PM ET" },
    { title: "Broncos at Chiefs", gameDate: "2026-09-14", week: 1, window: "MNF", time: "8:15 PM ET" },
    { title: "Lions at Bills", gameDate: "2026-09-17", week: 2, window: "TNF", time: "8:15 PM ET" },
    { title: "Colts at Chiefs", gameDate: "2026-09-20", week: 2, window: "SNF", time: "8:20 PM ET" },
    { title: "Giants at Rams", gameDate: "2026-09-21", week: 2, window: "MNF", time: "8:15 PM ET" },
    { title: "Falcons at Packers", gameDate: "2026-09-24", week: 3, window: "TNF", time: "8:15 PM ET" },
    { title: "Rams at Broncos", gameDate: "2026-09-27", week: 3, window: "SNF", time: "8:20 PM ET" },
    { title: "Eagles at Bears", gameDate: "2026-09-28", week: 3, window: "MNF", time: "8:15 PM ET" },
    { title: "Steelers at Browns", gameDate: "2026-10-01", week: 4, window: "TNF", time: "8:15 PM ET" },
    { title: "Lions at Panthers", gameDate: "2026-10-04", week: 4, window: "SNF", time: "8:20 PM ET" },
    { title: "Falcons at Saints", gameDate: "2026-10-05", week: 4, window: "MNF", time: "8:15 PM ET" },
    { title: "Buccaneers at Cowboys", gameDate: "2026-10-08", week: 5, window: "TNF", time: "8:15 PM ET" },
    { title: "Ravens at Falcons", gameDate: "2026-10-11", week: 5, window: "SNF", time: "8:20 PM ET" },
    { title: "Bills at Rams", gameDate: "2026-10-12", week: 5, window: "MNF", time: "8:15 PM ET" },
    { title: "Seahawks at Broncos", gameDate: "2026-10-15", week: 6, window: "TNF", time: "8:15 PM ET" },
    { title: "Cowboys at Packers", gameDate: "2026-10-18", week: 6, window: "SNF", time: "8:20 PM ET" },
    { title: "Commanders at 49ers", gameDate: "2026-10-19", week: 6, window: "MNF", time: "8:15 PM ET" },
    { title: "Patriots at Bears", gameDate: "2026-10-22", week: 7, window: "TNF", time: "8:15 PM ET" },
    { title: "Chiefs at Seahawks", gameDate: "2026-10-25", week: 7, window: "SNF", time: "8:20 PM ET" },
    { title: "Cowboys at Eagles", gameDate: "2026-10-26", week: 7, window: "MNF", time: "8:15 PM ET" },
    { title: "Panthers at Packers", gameDate: "2026-10-29", week: 8, window: "TNF", time: "8:15 PM ET" },
    { title: "Eagles at Commanders", gameDate: "2026-11-01", week: 8, window: "SNF", time: "8:20 PM ET" },
    { title: "Bears at Seahawks", gameDate: "2026-11-02", week: 8, window: "MNF", time: "8:15 PM ET" },
    { title: "Jaguars at Ravens", gameDate: "2026-11-05", week: 9, window: "TNF", time: "8:15 PM ET" },
    { title: "Buccaneers at Bears", gameDate: "2026-11-08", week: 9, window: "SNF", time: "8:20 PM ET" },
    { title: "Bills at Vikings", gameDate: "2026-11-09", week: 9, window: "MNF", time: "8:15 PM ET" },
    { title: "Commanders at Giants", gameDate: "2026-11-12", week: 10, window: "TNF", time: "8:15 PM ET" },
    { title: "Steelers at Bengals", gameDate: "2026-11-15", week: 10, window: "SNF", time: "8:20 PM ET" },
    { title: "Chargers at Ravens", gameDate: "2026-11-16", week: 10, window: "MNF", time: "8:15 PM ET" },
    { title: "Colts at Texans", gameDate: "2026-11-19", week: 11, window: "TNF", time: "8:15 PM ET" },
    { title: "Vikings at 49ers", gameDate: "2026-11-22", week: 11, window: "SNF", time: "8:20 PM ET" },
    { title: "Bengals at Commanders", gameDate: "2026-11-23", week: 11, window: "MNF", time: "8:15 PM ET" },
    { title: "Chiefs at Bills", gameDate: "2026-11-26", week: 12, window: "SNF", time: "8:20 PM ET" },
    { title: "Broncos at Steelers", gameDate: "2026-11-27", week: 12, window: "TNF", time: "3:00 PM ET" },
    { title: "Patriots at Chargers", gameDate: "2026-11-29", week: 12, window: "SNF", time: "8:20 PM ET" },
    { title: "Panthers at Buccaneers", gameDate: "2026-11-30", week: 12, window: "MNF", time: "8:15 PM ET" },
    { title: "Chiefs at Rams", gameDate: "2026-12-03", week: 13, window: "TNF", time: "8:15 PM ET" },
    { title: "Texans at Steelers", gameDate: "2026-12-06", week: 13, window: "SNF", time: "8:20 PM ET" },
    { title: "Cowboys at Seahawks", gameDate: "2026-12-07", week: 13, window: "MNF", time: "8:15 PM ET" },
    { title: "Vikings at Patriots", gameDate: "2026-12-10", week: 14, window: "TNF", time: "8:15 PM ET" },
    { title: "Bills at Packers", gameDate: "2026-12-13", week: 14, window: "SNF", time: "8:20 PM ET" },
    { title: "Steelers at Jaguars", gameDate: "2026-12-14", week: 14, window: "MNF", time: "8:15 PM ET" },
    { title: "49ers at Chargers", gameDate: "2026-12-17", week: 15, window: "TNF", time: "8:15 PM ET" },
    { title: "Lions at Vikings", gameDate: "2026-12-20", week: 15, window: "SNF", time: "8:20 PM ET" },
    { title: "Patriots at Chiefs", gameDate: "2026-12-21", week: 15, window: "MNF", time: "8:15 PM ET" },
    { title: "Texans at Eagles", gameDate: "2026-12-24", week: 16, window: "TNF", time: "8:15 PM ET" },
    { title: "Jaguars at Cowboys", gameDate: "2026-12-27", week: 16, window: "SNF", time: "8:20 PM ET" },
    { title: "Giants at Lions", gameDate: "2026-12-28", week: 16, window: "MNF", time: "8:15 PM ET" },
    { title: "Ravens at Bengals", gameDate: "2026-12-31", week: 17, window: "TNF", time: "8:15 PM ET" },
    { title: "Eagles at 49ers", gameDate: "2027-01-03", week: 17, window: "SNF", time: "8:20 PM ET" },
    { title: "Texans at Packers", gameDate: "2027-01-04", week: 17, window: "MNF", time: "8:15 PM ET" }
];
