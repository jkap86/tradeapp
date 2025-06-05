import pool from "@/lib/pool";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const identifier = searchParams.get("identifier") as string;

  const identifier_array = identifier?.split("__");

  const user_id = identifier_array[0];
  const league_id = identifier_array[1];
  const lm_user_id = identifier_array[2];

  console.log({ user_id, league_id, lm_user_id });
  const query = `
        SELECT *
        FROM db
        WHERE user_id = $1 AND league_id = $2 AND lm_user_id = $3
    `;

  const values = [user_id, league_id, lm_user_id];

  try {
    const result = await pool.query(query, values);

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    return NextResponse.json(err);
  }
}
