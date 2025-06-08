import OpenAI from "openai";

const openai = new OpenAI();

/**
 * Given a linear ranking of players, asks GPT-4 to suggest the most
 * informative multi-player comparisons (2-for-1, 2-for-2, 3-for-1, 3-for-2).
 *
 * @param ranking  Array of { rank: number; player_id: string }, 1 = best.
 * @param count    Number of suggestions to return (default 3).
 * @returns        Promise resolving to an array of comparisons:
 *   { type: string; groupA: string[]; groupB: string[] }
 */

export async function generateMultiPlayerComps(
  ranking: { rank: number; player_id: string }[],
  count = 3
): Promise<Array<{ type: string; groupA: string[]; groupB: string[] }>> {
  const systemPrompt = `
You are a fantasy‐football ranking assistant.  The user has provided a strict ranking of players.
Your job is to propose up to ${count} most informative comparisons, choosing from:
  - "2-for-1" (compare two players vs. one),
  - "2-for-2",
  - "3-for-1",
  - "3-for-2".
Each comparison should help disambiguate the user's ranking by targeting groups whose sums are closest.
Make sure to **avoid trivial matchups where transitive property can be used to determine result from rankings**.
Return only valid JSON in this shape:

{
  "comparisons": [
    { "id": "<random-uuid>", "a": ["<player_id>",…], "b": ["<player_id>",…], "winner": "" },
    …
  ]
}
`;

  const userPrompt = `
Here is the current ranking (1 = best):
${JSON.stringify(ranking, null, 2)}

Please output the JSON object described above with up to ${count} unique entries.
`;

  const resp = await openai.chat.completions.create({
    model: process.env.MODEL as string,
    messages: [
      { role: "system", content: systemPrompt.trim() },
      { role: "user", content: userPrompt.trim() },
    ],
  });

  const text =
    resp.choices?.[0]?.message?.content?.trim() || "Error fetching comparisons";

  const parsed = JSON.parse(text);

  return parsed.comparisons;
}
