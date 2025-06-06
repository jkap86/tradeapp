"use client";

import axios from "axios";
import { use, useEffect, useState } from "react";
import Allplayers from "@/lib/allplayers.json";
import { useRouter } from "next/navigation";

const allplayers: { [key: string]: { [key: string]: string } } =
  Object.fromEntries(
    Allplayers.data.map((player_obj: { [key: string]: string }) => [
      player_obj.player_id,
      player_obj,
    ])
  );

export default function Rank({
  params,
}: {
  params: Promise<{ identifier: string; type: "u" | "l" }>;
}) {
  const router = useRouter();
  const { identifier, type } = use(params);
  const [league_name, setLeague_name] = useState("");
  const [ranks, setRanks] = useState<{ rank: number; player_id: string }[]>([]);
  const [scores, setScores] = useState<
    { rank: number; player_id: string; score: number; manager: "u" | "l" }[]
  >([]);
  const [twoForOnes, SetTwoForOnes] = useState<
    {
      i: string;
      j: string;
      k: string;
      gap: number;
      winner: "" | "pair" | "single";
    }[]
  >([]);
  const [pairwiseVotes, setPairwiseVotes] = useState<
    {
      a: string;
      b: string;
      winner: string;
    }[]
  >([]);

  useEffect(() => {
    if (scores.length > 0) {
      const result = getTwoForOne(scores);

      SetTwoForOnes(
        result.map((r) => ({
          ...r,
          winner: "",
        }))
      );
    }
  }, [scores]);

  useEffect(() => {
    const fetchPlayers = async () => {
      const response = await axios.get("/api/fetchplayers", {
        params: {
          identifier,
        },
      });

      setLeague_name(response.data.league_name);

      if (type === "u") {
        if (response.data.user_ranks.length === 0) {
          setRanks(
            response.data.players.map(
              (
                player: { player_id: string; manager: "u" | "l" },
                index: number
              ) => {
                return { rank: index + 1, ...player };
              }
            )
          );
        } else {
          setRanks(response.data.user_ranks);
        }
      } else if (type === "l") {
        if (response.data.lm_ranks.length === 0) {
          setRanks(
            response.data.players.map(
              (
                player: { player_id: string; manager: "u" | "l" },
                index: number
              ) => {
                return { rank: index + 1, ...player };
              }
            )
          );
        } else {
          setRanks(response.data.lm_ranks);
        }
      }
    };

    fetchPlayers();
  }, []);

  const movePlayer = (rank: number, direction: "up" | "down") => {
    const currentRanks = ranks;

    const updatedRanks = currentRanks.map((cr) => {
      if (direction === "up") {
        if (cr.rank === rank) {
          cr.rank--;
        } else if (cr.rank == rank - 1) {
          cr.rank++;
        }
      } else if (direction === "down") {
        if (cr.rank === rank) {
          cr.rank++;
        } else if (cr.rank == rank + 1) {
          cr.rank--;
        }
      }

      return cr;
    });

    setRanks(updatedRanks);
  };

  const generateTwoForOnes = async () => {
    const scores = await axios.post("/api/generatetwoforones", {
      identifier,
      ranks,
      type,
    });

    setScores(scores.data.rankings);
    setPairwiseVotes(scores.data.pairwiseVotes);
  };

  const pickSide = (
    comp: {
      i: string;
      j: string;
      k: string;
      gap: number;
      winner: "" | "pair" | "single";
    },
    winner: "pair" | "single"
  ) => {
    const existingTwoForOnes = twoForOnes;

    SetTwoForOnes([
      ...existingTwoForOnes.filter(
        (e) => !(e.i === comp.i && e.j === comp.j && e.k === comp.k)
      ),
      {
        ...comp,
        winner,
      },
    ]);
  };

  const generateRankings = async () => {
    await axios.post("/api/generaterankings", {
      identifier,
      twoForOnes,
      type,
      existingVotes: pairwiseVotes,
    });

    router.push(`/summary/${identifier}`);
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center text-center">
      <h1>{league_name}</h1>
      <h2>Rank these players according to your league settings.</h2>
      <table className="table-fixed w-full">
        <tbody>
          {ranks
            .sort((a, b) => a.rank - b.rank)
            .map((player) => {
              return (
                <tr key={player.player_id} className="outline outline-gray-500">
                  <td>{player.rank}</td>
                  <td colSpan={3}>
                    {allplayers[player.player_id]?.position || "-"}
                    &nbsp;
                    {allplayers[player.player_id]?.full_name ||
                      player.player_id}
                    &nbsp;
                    {allplayers[player.player_id]?.team || "FA"}
                  </td>
                  <td
                    onClick={() =>
                      player.rank > 1 && movePlayer(player.rank, "up")
                    }
                    className="text-5xl"
                  >
                    +
                  </td>
                  <td
                    onClick={() =>
                      player.rank < ranks.length &&
                      movePlayer(player.rank, "down")
                    }
                    className="text-5xl"
                  >
                    -
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
      <button
        className="bg-blue-600 text-white px-3 py-1 rounded w-[15rem]"
        onClick={generateTwoForOnes}
      >
        Generate 2 for 1 comps
      </button>
      {twoForOnes.length > 0 && (
        <div className="flex flex-col items-center text-center">
          <ol>
            {twoForOnes
              .sort(
                (a, b) =>
                  a.gap - b.gap ||
                  parseInt(a.k) +
                    parseInt(a.i) +
                    parseInt(a.j) -
                    (parseInt(b.k) + parseInt(b.i) + parseInt(b.j))
              )
              .slice(0, 10)
              .map((comp) => {
                return (
                  <li
                    key={comp.i + comp.j + comp.k}
                    className="h-[7rem] flex justify-evenly items-center bg-gray-600 m-4"
                  >
                    <span
                      className={
                        (comp.winner === "pair"
                          ? "outline outline-2 outline-green-500"
                          : "") + " flex flex-col"
                      }
                      onClick={() => pickSide(comp, "pair")}
                    >
                      <span>{allplayers[comp.i]?.full_name || comp.i}</span>
                      <span>+</span>
                      <span>{allplayers[comp.j]?.full_name || comp.j}</span>
                    </span>

                    <span className="m-4">OR</span>

                    <span
                      onClick={() => pickSide(comp, "single")}
                      className={
                        comp.winner === "single"
                          ? "outline outline-2 outline-green-500"
                          : ""
                      }
                    >
                      {allplayers[comp.k]?.full_name || comp.k}
                    </span>
                  </li>
                );
              })}
          </ol>

          <button
            className="bg-blue-600 text-white px-3 py-1 rounded w-[15rem] mb-8"
            onClick={generateRankings}
          >
            Generate Rankings
          </button>
        </div>
      )}
    </div>
  );
}

const getTwoForOne = (
  scores: { rank: number; player_id: string; score: number }[]
) => {
  type TwoForOneCandidate = { i: string; j: string; k: string; gap: number };

  const N = scores.length;
  // Build a lookup: player_id → { rank, score }
  const lookup: Record<string, { rank: number; score: number }> = {};
  scores.forEach((p) => {
    lookup[p.player_id] = { rank: p.rank, score: p.score };
  });

  const candidates: TwoForOneCandidate[] = [];
  // Enumerate all unordered pairs (i, j)
  for (let a = 0; a < N - 1; a++) {
    for (let b = a + 1; b < N; b++) {
      const i = scores[a].player_id;
      const j = scores[b].player_id;
      const sumIJ = lookup[i].score + lookup[j].score;

      // For each possible singleton k
      for (let c = 0; c < N; c++) {
        const k = scores[c].player_id;
        if (k === i || k === j) continue;

        const { rank: rankI } = lookup[i];
        const { rank: rankJ } = lookup[j];
        const { rank: rankK } = lookup[k];
        // Filter out “obvious” cases: if both i and j individually outrank k
        if (!(rankI > rankK && rankJ > rankK)) continue;

        const gap = Math.abs(sumIJ - lookup[k].score);
        candidates.push({ i, j, k, gap });
      }
    }
  }

  // Sort by gap ascending and return the sorted array
  return candidates.sort((a, b) => a.gap - b.gap);
};
