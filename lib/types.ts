export interface Profile {
    id: string;
    display_name: string;
}

export interface Pick {
    id: string;
    user_id: string;
    selection: string;
    player_name?: string | null;
    bet_type?: string | null;
    team_name?: string | null;
    odds: number;

    result?: string;
    notes?: string;
}

export interface Parlay {
    id: string;
    title: string;
    game_date: string;
    status: string;
    created_by: string;
    total_odds?: number | null;

    picks: Pick[];
}
