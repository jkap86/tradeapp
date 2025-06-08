// File: app/api/calc-scores/route.ts
import pool from "@/lib/pool";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI();

export async function POST(req: NextRequest) {
  const { ranking, comparisons, identifier, type } = await req.json();

  const identifier_array = identifier?.split("__");

  const user_id = identifier_array[0];
  const league_id = identifier_array[1];
  const lm_user_id = identifier_array[2];

  const systemPrompt = `
You are a fantasy–football analytics assistant.  I will give you:
1) A strict linear ranking of players.
2) A set of multi-player comparison results.

Your task is to assign each player a numeric score on a 0–100 scale (higher is better),
such that all given comparisons are respected:
- For a "2-for-1" or similar where winner==="groupA", value(groupA sum) > value(groupB sum).
- If winner==="groupB", value(groupB sum) > value(groupA sum).

Return ONLY valid JSON in this exact shape:

{
  "scores": [
    { "player_id": "<id>", "rank": <number>, "score": <number> },
    …
  ]
}

Ensure:
- Scores are consistent with the ranking order and comparisons.
  `;

  const userPrompt = `
Here is the ranking array:
${JSON.stringify(ranking, null, 2)}

And here are the comparison results:
${JSON.stringify(comparisons, null, 2)}

Please output the JSON object described above.
  `;

  // Call the OpenAI API
  const response = await openai.chat.completions.create({
    model: process.env.MODEL as string,
    messages: [
      { role: "system", content: systemPrompt.trim() },
      { role: "user", content: userPrompt.trim() },
    ],
  });

  // Parse and return
  const text = response.choices[0].message.content || "Error generating scores";
  let parsed;
  try {
    parsed = JSON.parse(
      text
        .replace(/^\s*```(?:json)?\s*/, "") // leading ```json
        .replace(/\s*```$/, "") // trailing ```
        .trim()
    );

    const query = `
    UPDATE db
    SET ${type === "u" ? "user_ranks" : "lm_ranks"} = $4
    WHERE user_id = $1 AND lm_user_id = $2 AND league_id = $3; 
   `;

    const values = [user_id, lm_user_id, league_id, parsed.scores];

    await pool.query(query, values);
  } catch {
    return NextResponse.json(
      { error: "Failed to parse JSON from AI response", raw: text },
      { status: 500 }
    );
  }

  return NextResponse.json(parsed.scores);
}
