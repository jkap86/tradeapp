import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/pool";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const identifier = searchParams.get("identifier") as string;

  const identifier_array = identifier?.split("__");

  const user_id = identifier_array[0];
  const league_id = identifier_array[1];
  const lm_user_id = identifier_array[2];

  const query = `
    SELECT * FROM db
    WHERE user_id = $1 AND lm_user_id = $2 AND league_id = $3;
  `;

  const values = [user_id, lm_user_id, league_id];

  const result = await pool.query(query, values);

  const record = result.rows[0];

  if (record) {
    return NextResponse.json(record);
  } else {
    return NextResponse.json({ error: "Record not found..." });
  }
}
