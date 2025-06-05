import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { League } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const username = searchParams.get("username");

  try {
    const user = await axios.get(`https://api.sleeper.app/v1/user/${username}`);

    if (user) {
      const user_id = user.data.user_id;

      try {
        const leagues = await axios.get(
          `https://api.sleeper.app/v1/user/${user_id}/leagues/nfl/2025`
        );

        return NextResponse.json({
          user_id: user_id,
          username: user.data.display_name,
          avatar: user.data.avatar,
          leagues: leagues.data.map((league: League) => {
            return {
              league_id: league.league_id,
              name: league.name,
              avatar: league.avatar,
            };
          }),
        });
      } catch {
        return NextResponse.json({ error: "Error fetching leagues..." });
      }
    } else {
      return NextResponse.json({ error: "Username not found..." });
    }
  } catch {
    return NextResponse.json({ error: "Error fetching user..." });
  }
}
