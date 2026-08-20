"use client";

import { useState } from "react";

type ChartPoint = {
    game: number;
    date: string;
    winRate: number;
    wins: number;
    decisions: number;
};

export type WinRateSeries = {
    id: string;
    name: string;
    points: ChartPoint[];
};

export type WinRateDataset = {
    value: string;
    label: string;
    series: WinRateSeries[];
    dates: string[];
};

const COLORS = ["#60a5fa", "#34d399", "#f59e0b", "#f472b6"];
const WIDTH = 900;
const HEIGHT = 360;
const LEFT = 58;
const RIGHT = 22;
const TOP = 22;
const BOTTOM = 48;

function formatDate(date: string) {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric"
    }).format(new Date(`${date}T00:00:00`));
}

export default function WinRateChart({
    datasets
}: {
    datasets: WinRateDataset[];
}) {
    const [selectedPeriod, setSelectedPeriod] = useState("all");
    const dataset = datasets.find(item => item.value === selectedPeriod) ?? datasets[0];
    const series = dataset?.series ?? [];
    const dates = dataset?.dates ?? [];

    const selector = (
        <div className="mb-4 flex items-center gap-3">
            <label htmlFor="win-rate-period" className="text-sm font-semibold text-slate-300">Season</label>
            <select
                id="win-rate-period"
                value={selectedPeriod}
                onChange={event => setSelectedPeriod(event.target.value)}
                className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
            >
                {datasets.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
        </div>
    );

    if (!dates.length || !series.some(player => player.points.length)) {
        return <>{selector}<p className="py-10 text-center text-slate-500">No win-rate history for this period.</p></>;
    }

    const plotWidth = WIDTH - LEFT - RIGHT;
    const plotHeight = HEIGHT - TOP - BOTTOM;
    const x = (game: number) => LEFT + (dates.length === 1 ? plotWidth / 2 : (game / (dates.length - 1)) * plotWidth);
    const y = (rate: number) => TOP + ((100 - rate) / 100) * plotHeight;
    const labelIndexes = [...new Set([0, Math.floor((dates.length - 1) / 2), dates.length - 1])];

    return (
        <div>
            {selector}
            <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {series.map((player, index) => (
                    <div key={player.id} className="flex items-center gap-2 text-slate-300">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        {player.name}
                    </div>
                ))}
            </div>

            <div className="overflow-x-auto">
                <svg
                    viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                    className="min-w-[42rem] w-full"
                    role="img"
                    aria-label="Cumulative player win percentage over time"
                >
                    {[0, 25, 50, 75, 100].map(rate => (
                        <g key={rate}>
                            <line x1={LEFT} x2={WIDTH - RIGHT} y1={y(rate)} y2={y(rate)} stroke="#334155" strokeWidth="1" />
                            <text x={LEFT - 10} y={y(rate) + 4} textAnchor="end" fill="#94a3b8" fontSize="12">{rate}%</text>
                        </g>
                    ))}

                    {labelIndexes.map(index => (
                        <text key={index} x={x(index)} y={HEIGHT - 14} textAnchor="middle" fill="#94a3b8" fontSize="12">
                            {formatDate(dates[index])}
                        </text>
                    ))}

                    {series.map((player, index) => {
                        const color = COLORS[index % COLORS.length];
                        const path = player.points
                            .map((point, pointIndex) => `${pointIndex ? "L" : "M"} ${x(point.game)} ${y(point.winRate)}`)
                            .join(" ");

                        return (
                            <g key={player.id}>
                                <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                {player.points.map(point => (
                                    <circle key={point.game} cx={x(point.game)} cy={y(point.winRate)} r="4" fill={color} stroke="#0f172a" strokeWidth="2">
                                        <title>{`${player.name} — ${formatDate(point.date)}: ${point.winRate.toFixed(1)}% (${point.wins}-${point.decisions - point.wins})`}</title>
                                    </circle>
                                ))}
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}
