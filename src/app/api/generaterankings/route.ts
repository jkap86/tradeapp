import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/pool";
import { bradleyTerry } from "@/utils/bradleyTerry";

type PairwiseVote = {
  a: string; // player A ID
  b: string; // player B ID
  winner: string; // either a or b
};

export async function POST(req: NextRequest) {
  const formData = await req.json();

  const { identifier, twoForOnes, type } = formData;

  const identifier_array = identifier?.split("__");

  const user_id = identifier_array[0];
  const league_id = identifier_array[1];
  const lm_user_id = identifier_array[2];

  if (!["u", "l"].includes(type))
    return NextResponse.json("Error with type...");

  const comps: { player_id: string; player_id2: string; winner: string }[] = [];

  twoForOnes.map(
    (twoForOne: { i: string; j: string; k: string; winner: string }) => {
      if (twoForOne.winner === "pair") {
        comps.push({
          player_id: twoForOne.i,
          player_id2: twoForOne.k,
          winner: twoForOne.i,
        });

        comps.push({
          player_id: twoForOne.j,
          player_id2: twoForOne.k,
          winner: twoForOne.j,
        });
      } else {
        comps.push({
          player_id: twoForOne.i,
          player_id2: twoForOne.k,
          winner: twoForOne.k,
        });

        comps.push({
          player_id: twoForOne.j,
          player_id2: twoForOne.k,
          winner: twoForOne.k,
        });
      }
    }
  );
  const pairwiseVotes: PairwiseVote[] = [
    ...comps.map(
      (v: { player_id: string; player_id2: string; winner: string }) => ({
        a: v.player_id,
        b: v.player_id2,
        winner: v.winner,
      })
    ),
  ];

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
