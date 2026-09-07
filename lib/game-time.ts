export const GAME_TIME_ZONE = "America/New_York";

const easternParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: GAME_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
});

export function easternDateTime(value: string | Date) {
    const parts = Object.fromEntries(easternParts.formatToParts(new Date(value)).map(part => [part.type, part.value]));
    return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

export function easternKickoffToIso(date: string, time: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
        throw new Error("Enter a valid game date and start time.");
    }
    // Try both modern Eastern offsets and round-trip through the IANA timezone.
    // This rejects invalid dates, nonexistent spring times and ambiguous fall times.
    const candidates = ["-04:00", "-05:00"].map(offset => new Date(`${date}T${time}:00${offset}`))
        .filter(candidate => {
            if (!Number.isFinite(candidate.getTime())) return false;
            const local = easternDateTime(candidate);
            return local.date === date && local.time === time;
        });
    if (candidates.length !== 1) throw new Error("This date/time is invalid or ambiguous during a daylight saving change. Choose another start time.");
    return candidates[0].toISOString();
}

export function formatKickoff(value: string) {
    return new Intl.DateTimeFormat("en-US", {
        timeZone: GAME_TIME_ZONE, hour: "numeric", minute: "2-digit", timeZoneName: "short"
    }).format(new Date(value));
}

export function scheduledKickoffToIso(date: string, label: string) {
    const match = /^(\d{1,2}):(\d{2}) (AM|PM) ET$/.exec(label);
    if (!match || Number(match[1]) < 1 || Number(match[1]) > 12) throw new Error("Invalid schedule start time.");
    const hour = Number(match[1]) % 12 + (match[3] === "PM" ? 12 : 0);
    return easternKickoffToIso(date, `${String(hour).padStart(2, "0")}:${match[2]}`);
}
