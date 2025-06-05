import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/pool";

export async function POST(req: NextRequest) {
  const formData = await req.json();

  const {
    selectedPlayers,
    user_id,
    username,
    league_id,
    league_name,
    lm_user_id,
    lm_username,
  } = formData;

  const query = `
    INSERT INTO db (
        user_id,
        username,
        lm_user_id,
        lm_username,
        league_id,
        league_name,
        players,
        user_ranks,
        lm_ranks
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (user_id, lm_user_id, league_id)
    DO UPDATE SET
        players = EXCLUDED.players,
        user_ranks = EXCLUDED.user_ranks,
        lm_ranks = EXCLUDED.lm_ranks;
    `;

  const values = [
    user_id,
    username,
    lm_user_id,
    lm_username,
    league_id,
    league_name,
    selectedPlayers,
    [],
    [],
  ];

  try {
    await pool.query(query, values);

    const identifier = `${user_id}__${league_id}__${lm_user_id}`;

    return NextResponse.json(identifier);
  } catch (err) {
    return NextResponse.json(err);
  }
}
