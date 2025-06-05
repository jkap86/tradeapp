import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/pool";
import { bradleyTerry } from "@/utils/bradleyTerry";
import { PairwiseVote } from "@/utils/bradleyTerry";

export async function POST(req: NextRequest) {
  const formData = await req.json();

  const { identifier, ranks, type } = formData;

  const identifier_array = identifier?.split("__");

  const user_id = identifier_array[0];
  const league_id = identifier_array[1];
  const lm_user_id = identifier_array[2];

  if (!["u", "l"].includes(type))
    return NextResponse.json("Error with type...");

  /*
  const players: { [player_id: string]: { wins: number; losses: number } } = {};

  comps.forEach(
    ({
      player_id,
      player_id2,
      winner,
    }: {
      player_id: string;
      player_id2: string;
      winner: string;
    }) => {
      if (!players[player_id]) players[player_id] = { wins: 0, losses: 0 };
      if (!players[player_id2]) players[player_id2] = { wins: 0, losses: 0 };

      if (winner === player_id) {
        players[player_id].wins += 1;
        players[player_id2].losses += 1;
      } else {
        players[player_id2].wins += 1;
        players[player_id].losses += 1;
      }
    }
  );


  const rankings = Object.keys(players)
    .sort(
      (a, b) =>
        players[b].wins - players[a].wins ||
        players[a].losses - players[b].losses
    )
    .map((player, index) => ({
      player,
      rank: index + 1,
      score: Math.round(
        (players[player].wins /
          (players[player].wins + players[player].losses)) *
          100
      ),
      wins: players[player].wins,
      losses: players[player].losses,
    }));
  */

  const comps: { player_id: string; player_id2: string; winner: string }[] = [];

  ranks.forEach((player1: { rank: number; player_id: string }) => {
    ranks.forEach((player2: { rank: number; player_id: string }) => {
      if (
        player1.player_id !== player2.player_id &&
        !comps.some(
          (c) =>
            c.player_id === player2.player_id &&
            c.player_id2 === player1.player_id
        )
      ) {
        comps.push({
          player_id: player1.player_id,
          player_id2: player2.player_id,
          winner:
            player1.rank < player2.rank ? player1.player_id : player2.player_id,
        });
      }
    });
  });

  const pairwiseVotes: PairwiseVote[] = comps.map(
    (v: { player_id: string; player_id2: string; winner: string }) => ({
      a: v.player_id,
      b: v.player_id2,
      winner: v.winner,
    })
  );

  const btScores = bradleyTerry(pairwiseVotes);

  const rankings: {
    player_id: string;
    rank: number;
    score: number;
  }[] = [];

  Object.keys(btScores)
    .sort((a, b) => btScores[b] - btScores[a])
    .forEach((player_id, index) => {
      rankings.push({
        player_id,
        rank: index + 1,
        score: Math.round(btScores[player_id] * 100),
      });
    });

  const query = `
    UPDATE db
    SET ${type === "u" ? "user_ranks" : "lm_ranks"} = $4
    WHERE user_id = $1 AND lm_user_id = $2 AND league_id = $3; 
   `;

  const values = [user_id, lm_user_id, league_id, rankings];

  await pool.query(query, values);

  return NextResponse.json({ rankings, pairwiseVotes });
}

/**
 * Given an array of PairwiseVote objects, runs a Bradley–Terry MLE solver
 * and returns a map: { [playerId]: rating } where ratings are normalized so max=1.
 */
