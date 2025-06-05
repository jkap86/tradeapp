export type PairwiseVote = {
  a: string; // player A ID
  b: string; // player B ID
  winner: string; // either a or b
};

export const bradleyTerry = (
  votes: PairwiseVote[],
  maxIters = 1000,
  eps = 1e-6
): Record<string, number> => {
  // 1) Collect all unique player IDs
  const players = new Set<string>();
  votes.forEach(({ a, b }) => {
    players.add(a);
    players.add(b);
  });
  const playerList = Array.from(players);

  // 2) Initialize each player's rating to 1.0
  const rating: Record<string, number> = {};
  playerList.forEach((p) => (rating[p] = 1));

  // 3) Build head-to-head tallies for "wins" and "total matches"
  //    wins[i][j] = # of times i beat j
  //    total[i][j] = # of times i faced j (i.e. matches between i and j)
  const wins: Record<string, Record<string, number>> = {};
  const totalMatches: Record<string, Record<string, number>> = {};

  playerList.forEach((i) => {
    wins[i] = {};
    totalMatches[i] = {};
    playerList.forEach((j) => {
      wins[i][j] = 0;
      totalMatches[i][j] = 0;
    });
  });

  // 3a) Populate from the votes
  votes.forEach(({ a, b, winner }) => {
    // Increment total matches for both directions
    totalMatches[a][b]++;
    totalMatches[b][a]++;
    // Increment win for the winner
    if (winner === a) {
      wins[a][b]++;
    } else {
      wins[b][a]++;
    }
  });

  // 4) Iteratively solve the BT equations
  for (let iter = 0; iter < maxIters; iter++) {
    let maxDiff = 0;
    const newRating: Record<string, number> = {};

    playerList.forEach((i) => {
      // Sum over all opponents j ≠ i:
      let sumTerm = 0;
      playerList.forEach((j) => {
        if (i === j) return; // skip self
        const w_ij = wins[i][j]; // # times i beat j
        const m_ij = totalMatches[i][j]; // # total matches between i & j
        if (m_ij === 0) return; // no matches → no contribution
        // Bradley-Terry update: w_ij / (r_i + r_j)
        sumTerm += w_ij / (rating[i] + rating[j]);
      });
      newRating[i] = sumTerm; // un-normalized
    });

    // Normalize so that max(newRating) = 1 (you can also normalize sum to 1 if you prefer)
    const maxR = Math.max(...Object.values(newRating));
    playerList.forEach((p) => {
      newRating[p] = newRating[p] / maxR;
    });

    // Check convergence
    playerList.forEach((p) => {
      const diff = Math.abs(newRating[p] - rating[p]);
      if (diff > maxDiff) maxDiff = diff;
    });

    Object.assign(rating, newRating);
    if (maxDiff < eps) break;
  }

  return rating;
};
