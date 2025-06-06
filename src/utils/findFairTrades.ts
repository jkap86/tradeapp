/**
 * Given two rosters (`userScores` and `lmScores`), each as arrays of
 * `{ player_id: string; score: number }`, returns all possible trades
 * where the total score difference is within `margin`. Trades that
 * include the same player on both sides are excluded.
 *
 * A “trade” here is any non‐empty subset of `userScores` swapped for any
 * non‐empty subset of `lmScores`, as long as
 *   | sumUser – sumLm | ≤ margin.
 */

type PlayerScore = { player_id: string; score: number };

type Trade = {
  user: string[]; // player_ids from user’s roster
  lm: string[]; // player_ids from leaguemate’s roster
  sumUser: number; // total score of `user`
  sumLm: number; // total score of `lm`
  diff: number; // Math.abs(sumUser - sumLm)
};

/**
 * Generate all non‐empty subsets of `players`. Returns an array of
 * objects { subset: string[], sum: number } where `subset` is a list
 * of player_ids and `sum` is the sum of their scores.
 */
function allSubsets(
  players: PlayerScore[]
): Array<{ subset: string[]; sum: number }> {
  const result: Array<{ subset: string[]; sum: number }> = [];
  const n = players.length;
  const totalMasks = 1 << n; // 2^n

  for (let mask = 1; mask < totalMasks; mask++) {
    let sum = 0;
    const subset: string[] = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        subset.push(players[i].player_id);
        sum += players[i].score;
      }
    }
    result.push({ subset, sum });
  }

  return result;
}

/**
 * Finds all fair trades between `userScores` and `lmScores` given a `margin`.
 * Excludes any trade where the same player appears on both sides.
 * Returns an array of Trade objects with keys:
 *   - user: string[]
 *   - lm: string[]
 *   - sumUser: number
 *   - sumLm: number
 *   - diff: number
 */
export function findFairTrades(
  userScores: PlayerScore[],
  lmScores: PlayerScore[],
  margin = 5
): Trade[] {
  // 1) Build all non-empty subsets for each side
  const subsUser = allSubsets(userScores);
  const subsLm = allSubsets(lmScores);

  const trades: Trade[] = [];
  // 2) For each subset from user, check every subset from lm
  for (const { subset: userSubset, sum: sumUser } of subsUser) {
    for (const { subset: lmSubset, sum: sumLm } of subsLm) {
      // Exclude any trade where the same player appears on both sides
      const overlap = userSubset.some((pid) => lmSubset.includes(pid));
      if (overlap) continue;

      const diff = Math.abs(sumUser - sumLm);
      if (diff <= margin) {
        trades.push({
          user: userSubset.slice(), // clone to be safe
          lm: lmSubset.slice(),
          sumUser,
          sumLm,
          diff,
        });
      }
    }
  }

  return trades;
}
