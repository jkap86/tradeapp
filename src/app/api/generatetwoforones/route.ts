import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/pool";
import { bradleyTerry } from "@/utils/bradleyTerry";
import { PairwiseVote } from "@/utils/bradleyTerry";
import { generateMultiPlayerComps } from "@/utils/openAi";

type PlayerRank = { rank: number; player_id: string };

export async function POST(req: NextRequest) {
  const formData = await req.json();

  const {
    identifier,
    ranks,
    type,
  }: { identifier: string; ranks: PlayerRank[]; type: string } = formData;

  const identifier_array = identifier?.split("__");

  const user_id = identifier_array[0];
  const league_id = identifier_array[1];
  const lm_user_id = identifier_array[2];

  if (!["u", "l"].includes(type))
    return NextResponse.json("Error with type...");

  /*
  const comps: { player_id: string; player_id2: string; winner: string }[] = [];

  ranks.forEach((player1: PlayerRank) => {
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
  

  const ranks_w_scores: {
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

  const values = [user_id, lm_user_id, league_id, ranks_w_scores];

  await pool.query(query, values);
*/

  const multiPlayerComps = await generateMultiPlayerComps(ranks, 10);

  return NextResponse.json(multiPlayerComps);
}

/**
 * Given an array of PairwiseVote objects, runs a Bradley–Terry MLE solver
 * and returns a map: { [playerId]: rating } where ratings are normalized so max=1.
 */
