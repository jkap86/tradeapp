type PlayerScore = { player_id: string; score: number };

type Trade = {
  user: string[]; // player_ids the user gives (must come from userRoster)
  lm: string[]; // player_ids the mate gives (must come from lmRoster)
  sumUserGive: number; // total of userVal for the user-given players
  sumUserReceive: number; // total of userVal for the mate-given players
  sumLmGive: number; // total of lmVal for the mate-given players
  sumLmReceive: number; // total of lmVal for the user-given players
  userDiff: number; // sumUserReceive - sumUserGive
  lmDiff: number;
};

/** helper to enumerate all non‐empty subsets of a given roster */
function allSubsets(
  rosterIds: string[],
  valMap: Record<string, number>
): Array<{ subset: string[]; sum: number }> {
  const result: Array<{ subset: string[]; sum: number }> = [];
  const n = rosterIds.length;
  for (let mask = 1; mask < 1 << n; mask++) {
    let sum = 0;
    const subset: string[] = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        const pid = rosterIds[i];
        subset.push(pid);
        sum += valMap[pid] ?? 0;
      }
    }
    result.push({ subset, sum });
  }
  return result;
}

/**
 * Finds all mutually beneficial trades between two managers.
 *
 * @param userRoster  – player_ids the user actually owns
 * @param lmRoster    – player_ids the mate actually owns
 * @param userScores  – user’s valuation for every player (array of {player_id,score})
 * @param lmScores    – mate’s valuation for every player
 */
export function findFairTrades(
  userRoster: string[],
  lmRoster: string[],
  userScores: PlayerScore[],
  lmScores: PlayerScore[]
): Trade[] {
  // Build quick lookup tables
  const userVal: Record<string, number> = {};
  userScores.forEach((p) => (userVal[p.player_id] = p.score));
  const lmVal: Record<string, number> = {};
  lmScores.forEach((p) => (lmVal[p.player_id] = p.score));

  // Enumerate subsets *only* from each manager’s actual roster
  const subsUser = allSubsets(userRoster, userVal);
  const subsLm = allSubsets(lmRoster, lmVal);

  const trades: Trade[] = [];
  for (const { subset: giveUser, sum: sumUserGive } of subsUser) {
    for (const { subset: giveLm, sum: sumLmGive } of subsLm) {
      // no overlapping players
      if (giveUser.some((pid) => giveLm.includes(pid))) continue;

      // what user receives (valued by the user)
      const sumUserReceive = giveLm.reduce(
        (acc, pid) => acc + (userVal[pid] || 0),
        0
      );
      // what mate receives (valued by the mate)
      const sumLmReceive = giveUser.reduce(
        (acc, pid) => acc + (lmVal[pid] || 0),
        0
      );

      // mutual benefit
      const userGain = sumUserReceive - sumUserGive;
      const lmGain = sumLmReceive - sumLmGive;
      if (userGain > 0 && lmGain > 0) {
        trades.push({
          user: [...giveUser],
          lm: [...giveLm],
          sumUserGive,
          sumUserReceive,
          sumLmGive,
          sumLmReceive,
          userDiff: sumUserReceive - sumUserGive,
          lmDiff: sumLmReceive - sumLmGive,
        });
      }
    }
  }

  return trades;
}
