"use client";

import Allplayers from "@/lib/allplayers.json";
import axios from "axios";
import { ReactNode, use, useEffect, useState } from "react";

interface summary {
  league_id: string;
  league_name: string;
  lm_ranks: { rank: number; score: number; player_id: string }[];
  lm_user_id: string;
  lm_username: string;
  players: string[];
  user_id: string;
  username: string;
  user_ranks: { rank: number; score: number; player_id: string }[];
}

const allplayers: { [key: string]: { [key: string]: string } } =
  Object.fromEntries(
    Allplayers.data.map((player_obj: { [key: string]: string }) => [
      player_obj.player_id,
      player_obj,
    ])
  );

export default function Summary({
  params,
}: {
  params: Promise<{ identifier: string }>;
}) {
  const { identifier } = use(params);
  const [summary, setSummary] = useState<summary>({
    league_id: "",
    league_name: "",
    lm_ranks: [],
    lm_user_id: "",
    lm_username: "",
    players: [],
    user_id: "",
    username: "",
    user_ranks: [],
  });
  const [sortby, setSortby] = useState("L");

  useEffect(() => {
    const fetchSummary = async () => {
      const response = await axios.get("/api/summary", {
        params: {
          identifier,
        },
      });

      setSummary(response.data);
    };
    fetchSummary();
  }, [identifier]);

  return (
    <div className="flex flex-col">
      <h1>Summary</h1>
      <div className="flex column"></div>
      <table className="summary">
        <thead>
          <tr>
            <th rowSpan={2}>Player</th>
            <th colSpan={2}>{summary.username}</th>
            <th colSpan={2}>{summary.lm_username}</th>
          </tr>
          <tr>
            <th onClick={() => setSortby("U")}>Rank</th>
            <th onClick={() => setSortby("U")}>Score</th>
            <th onClick={() => setSortby("L")}>Rank</th>
            <th onClick={() => setSortby("L")}>Score</th>
          </tr>
        </thead>
        <tbody>
          {(summary.players || [])
            .map((player_id: string, index: number) => {
              const player_name = allplayers[player_id]?.full_name || player_id;
              const user_ranking = summary.user_ranks.find(
                (r: { [key: string]: string | number }) =>
                  r.player_id === player_id
              );
              const lm_ranking = summary.lm_ranks.find(
                (r: { [key: string]: string | number }) =>
                  r.player_id === player_id
              );
              return {
                sort:
                  sortby === "L"
                    ? lm_ranking?.score || 0
                    : user_ranking?.score || 0,
                row: (
                  <tr key={`${player_id}_${index}`}>
                    <td>{player_name}</td>
                    <td>{user_ranking?.rank?.toString() || "-"}</td>
                    <td>{user_ranking?.score?.toString() || "-"}</td>
                    <td>{lm_ranking?.rank?.toString() || "-"}</td>
                    <td>{lm_ranking?.score?.toString() || "-"}</td>
                  </tr>
                ),
              };
            })
            .sort((a, b) => (b.sort > a.sort ? 1 : -1))
            .map((row: { row: ReactNode }) => row.row)}
        </tbody>
      </table>
    </div>
  );
}
