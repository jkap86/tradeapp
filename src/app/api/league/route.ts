import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import {
  SleeperLeague,
  SleeperRoster,
  SleeperUser,
  SleeperDraft,
  SleeperDraftpick,
  Draftpick,
} from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const league_id = searchParams.get("league_id");

  try {
    const [league, users, rosters] = await Promise.all([
      (await axios.get(`https://api.sleeper.app/v1/league/${league_id}`)).data,
      (
        await axios.get(`https://api.sleeper.app/v1/league/${league_id}/users`)
      ).data,
      (
        await axios.get(
          `https://api.sleeper.app/v1/league/${league_id}/rosters`
        )
      ).data,
    ]);

    let league_draftpicks_obj;

    if (league.settings.type === 2) {
      const drafts = await (
        await axios.get(
          `https://api.sleeper.app/v1/league/${league.league_id}/drafts`
        )
      ).data;
      const traded_picks = await (
        await axios.get(
          `https://api.sleeper.app/v1/league/${league.league_id}/traded_picks`
        )
      ).data;

      league_draftpicks_obj = getTeamDraftPicks(
        league,
        rosters,
        users,
        drafts,
        traded_picks
      );
    } else {
      league_draftpicks_obj = {};
    }

    const rosters_w_username = getRostersUsername(
      rosters,
      users,
      league_draftpicks_obj
    );

    return NextResponse.json({
      ...league,
      rosters: rosters_w_username,
    });
  } catch (err) {
    return NextResponse.json({ err });
  }
}

const getTeamDraftPicks = (
  league: SleeperLeague,
  rosters: SleeperRoster[],
  users: SleeperUser[],
  drafts: SleeperDraft[],
  traded_picks: SleeperDraftpick[]
) => {
  const upcoming_draft = drafts.find(
    (x) =>
      x.status !== "complete" &&
      x.settings.rounds === league.settings.draft_rounds
  );

  const draft_season = upcoming_draft
    ? parseInt(league.season)
    : parseInt(league.season) + 1;

  const draft_order = upcoming_draft?.draft_order;

  const draft_picks_league: {
    [key: number]: Draftpick[];
  } = {};

  rosters.forEach((roster) => {
    const draft_picks_team: Draftpick[] = [];

    const user = users.find((u) => u.user_id === roster.owner_id);

    // loop through seasons (draft season and next two seasons)

    for (let j = draft_season; j <= draft_season + 2; j++) {
      // loop through rookie draft rounds

      for (let k = 1; k <= league.settings.draft_rounds; k++) {
        // check if each rookie pick is in traded picks

        const isTraded = traded_picks.find(
          (pick: SleeperDraftpick) =>
            parseInt(pick.season) === j &&
            pick.round === k &&
            pick.roster_id === roster.roster_id
        );

        // if it is not in traded picks, add to original manager

        if (!isTraded) {
          draft_picks_team.push({
            season: j,
            round: k,
            roster_id: roster.roster_id,
            original_user: {
              avatar: user?.avatar || "",
              user_id: roster.owner_id,
              username: user?.display_name || "Orphan",
            },
            order:
              (draft_order &&
                j === parseInt(upcoming_draft.season) &&
                draft_order[roster?.owner_id]) ||
              null,
          });
        }
      }
    }

    traded_picks
      .filter(
        (x) =>
          x.owner_id === roster.roster_id && parseInt(x.season) >= draft_season
      )
      .forEach((pick) => {
        const original_roster = rosters.find(
          (t) => t.roster_id === pick.roster_id
        );

        const original_user = users.find(
          (u) => u.user_id === original_roster?.owner_id
        );

        if (original_roster) {
          draft_picks_team.push({
            season: parseInt(pick.season),
            round: pick.round,
            roster_id: pick.roster_id,
            original_user: {
              avatar: original_user?.avatar || "",
              user_id: original_user?.user_id || "",
              username: original_user?.display_name || "Orphan",
            },
            order:
              (original_user &&
                draft_order &&
                parseInt(pick.season) === parseInt(upcoming_draft.season) &&
                draft_order[original_user?.user_id]) ||
              null,
          });
        }
      });

    traded_picks
      .filter(
        (x) =>
          x.previous_owner_id === roster.roster_id &&
          parseInt(x.season) >= draft_season
      )
      .forEach((pick) => {
        const index = draft_picks_team.findIndex((obj) => {
          return (
            obj.season === parseInt(pick.season) &&
            obj.round === pick.round &&
            obj.roster_id === pick.roster_id
          );
        });

        if (index !== -1) {
          draft_picks_league[roster.roster_id].splice(index, 1);
        }
      });

    draft_picks_league[roster.roster_id] = draft_picks_team;
  });

  return draft_picks_league;
};

const getRostersUsername = (
  rosters: SleeperRoster[],
  users: SleeperUser[],
  league_draftpicks_obj: { [key: string]: Draftpick[] }
) => {
  const rosters_username = rosters.map((roster) => {
    const user = users.find((user) => user.user_id === roster.owner_id);

    return {
      roster_id: roster.roster_id,
      username: user?.display_name || "Orphan",
      user_id: roster.owner_id,
      avatar: user?.avatar || null,
      players: roster.players,
      draftpicks: league_draftpicks_obj[roster.roster_id] || [],
      starters: roster.starters || [],
      taxi: roster.taxi || [],
      reserve: roster.reserve || [],
      wins: roster.settings.wins,
      losses: roster.settings.losses,
      ties: roster.settings.ties,
      fp: parseFloat(
        `${roster.settings.fpts}.${roster.settings.fpts_decimal || 0}`
      ),
      fpa: parseFloat(
        `${roster.settings.fpts_against || 0}.${
          roster.settings.fpts_against_decimal || 0
        }`
      ),
    };
  });

  return rosters_username;
};
