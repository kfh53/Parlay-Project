export type FootballStage = "regular" | "wild_card" | "divisional" | "conference" | "super_bowl";

export function getFootballMetadata(dateString: string) {
    const date = new Date(`${dateString}T12:00:00`);
    const calendarYear = date.getFullYear();
    const season = date.getMonth() < 2 ? calendarYear - 1 : calendarYear;
    const regularStart = getRegularSeasonStart(season);
    const day = 86_400_000;
    const daysSinceStart = Math.floor((date.getTime() - regularStart.getTime()) / day);

    if (daysSinceStart >= 0 && daysSinceStart < 123) {
        return { season, week: Math.min(18, Math.floor(daysSinceStart / 7) + 1), stage: "regular" as FootballStage };
    }

    const wildCardStart = addDays(regularStart, 128);
    const divisionalStart = addDays(wildCardStart, 7);
    const conferenceStart = addDays(divisionalStart, 7);
    const superBowlStart = addDays(conferenceStart, 15);

    if (date >= wildCardStart && date < divisionalStart) return { season, week: 19, stage: "wild_card" as FootballStage };
    if (date >= divisionalStart && date < conferenceStart) return { season, week: 20, stage: "divisional" as FootballStage };
    if (date >= conferenceStart && date < superBowlStart) return { season, week: 21, stage: "conference" as FootballStage };
    if (date >= superBowlStart && date <= addDays(superBowlStart, 1)) return { season, week: 22, stage: "super_bowl" as FootballStage };

    // Dates outside the season start a new/current season at regular-season week one.
    return { season, week: 1, stage: "regular" as FootballStage };
}

function getRegularSeasonStart(season: number) {
    const septemberFirst = new Date(season, 8, 1, 12);
    const laborDayOffset = (8 - septemberFirst.getDay()) % 7;
    const laborDay = addDays(septemberFirst, laborDayOffset);
    return addDays(laborDay, 3);
}

function addDays(date: Date, days: number) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
}
