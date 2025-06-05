export type League = {
  league_id: string;
  avatar: string;
  name: string;
};

export type User = {
  user_id: string;
  username: string;
  avatar: string;
  leagues: League[];
};

export type Roster = {
  roster_id: number;
  username: string;
  user_id: string;
  players: string[];
  draftpicks: Draftpick[];
};

export type Leaguemate = {
  user_id: string;
  avatar: string;
  display_name: string;
};

export type LeagueDetail = {
  league_id: string;
  avatar: string;
  name: string;
  rosters: {
    roster_id: number;
    avatar: string;
    user_id: string;
    username: string;
    players: string[];
    draftpicks: Draftpick[];
  }[];
};

export type SleeperLeague = {
  league_id: string;
  name: string;
  avatar: string;
  settings: { [key: string]: number };
  season: string;
};

export type SleeperUser = {
  user_id: string;
  display_name: string;
  avatar: string | null;
};

export type SleeperDraft = {
  draft_id: string;
  season: string;
  draft_order: {
    [key: string]: number;
  };
  last_picked: number | null;
  status: string;
  settings: {
    rounds: number;
    slots_k: number;
  };
};

export type SleeperRoster = {
  roster_id: number;
  owner_id: string;
  players: string[];
  reserve?: string[];
  settings: {
    wins: number;
    losses: number;
    ties: number;
    fpts: number;
    fpts_decimal?: number;
    fpts_against?: number;
    fpts_against_decimal?: number;
  };
  starters: string[];
  taxi?: string[];
};

export type SleeperDraftpick = {
  season: string;
  owner_id: number;
  roster_id: number;
  previous_owner_id: number;
  round: number;
};

export type Draftpick = {
  season: number;
  round: number;
  roster_id: number;
  original_user: {
    avatar: string;
    user_id: string;
    username: string;
  };
  order?: number | null;
};
