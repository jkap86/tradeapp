"use client";

import Allplayers from "@/lib/allplayers.json";
import { findFairTrades } from "@/utils/findFairTrades";
import axios from "axios";
import { ReactNode, use, useEffect, useState } from "react";

interface summary {
  league_id: string;
  league_name: string;
  lm_ranks: { rank: number; score: number; player_id: string }[];
  lm_user_id: string;
  lm_username: string;
  players: { player_id: string; manager: "u" | "l" }[];
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
  const [sortby, setSortby] = useState("U");
  const [fairTrades, setFairTrades] = useState<
    {
      user: string[];
      lm: string[];
      sumUser: number;
      sumLm: number;
      diff: number;
    }[]
  >([]);

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

  useEffect(() => {
    if (summary.user_ranks.length > 0 && summary.lm_ranks.length > 0) {
      const trades = findFairTrades(summary.user_ranks, summary.lm_ranks);

      setFairTrades(trades);
    }
  }, [summary]);

  return (
    <div className="flex flex-col items-center text-center">
      <h1>Summary</h1>
      <div className="flex column"></div>
      <table className="w-full table-fixed border-separate border-spacing-y-2">
        <thead>
          <tr>
            <th colSpan={3} rowSpan={2} className="bg-yellow-600">
              Player
            </th>
            <th
              colSpan={2}
              onClick={() => setSortby("U")}
              className="bg-blue-600"
            >
              {summary.username}
            </th>
            <th
              colSpan={2}
              onClick={() => setSortby("L")}
              className="bg-red-600"
            >
              {summary.lm_username}
            </th>
            {summary.user_ranks.length > 0 && summary.lm_ranks.length > 0 && (
              <th rowSpan={2}>Score Delta</th>
            )}
          </tr>
          <tr>
            <th onClick={() => setSortby("U")} className="bg-blue-600">
              Rank
            </th>
            <th onClick={() => setSortby("U")} className="bg-blue-600">
              Score
            </th>
            <th onClick={() => setSortby("L")} className="bg-red-600">
              Rank
            </th>
            <th onClick={() => setSortby("L")} className="bg-red-600">
              Score
            </th>
          </tr>
        </thead>
        <tbody>
          {(summary.players || [])
            .map((player, index: number) => {
              const player_name =
                allplayers[player.player_id]?.full_name || player.player_id;
              const user_ranking = summary.user_ranks.find(
                (r: { [key: string]: string | number }) =>
                  r.player_id === player.player_id
              );
              const lm_ranking = summary.lm_ranks.find(
                (r: { [key: string]: string | number }) =>
                  r.player_id === player.player_id
              );
              return {
                sort:
                  sortby === "L"
                    ? lm_ranking?.score || 0
                    : user_ranking?.score || 0,
                row: (
                  <tr
                    key={`${player.player_id}_${index}`}
                    className="bg-gray-600"
                  >
                    <td colSpan={3}>{player_name}</td>
                    <td>{user_ranking?.rank?.toString() || "-"}</td>
                    <td>{user_ranking?.score?.toString() || "-"}</td>
                    <td>{lm_ranking?.rank?.toString() || "-"}</td>
                    <td>{lm_ranking?.score?.toString() || "-"}</td>
                    {user_ranking && lm_ranking && (
                      <td>
                        {(user_ranking.score - lm_ranking.score).toString()}
                      </td>
                    )}
                  </tr>
                ),
              };
            })
            .sort((a, b) => (b.sort > a.sort ? 1 : -1))
            .map((row: { row: ReactNode }) => row.row)}
        </tbody>
      </table>

      {summary.user_ranks.length > 0 && summary.lm_ranks.length > 0 && (
        <div className="w-full">
          <h1 className="mb-8">Recommended Trades</h1>
          <ol>
            {fairTrades.map((ft) => {
              return (
                <li
                  key={ft.user.join("_") + ft.lm.join("_")}
                  className="w-full flex mb-8"
                >
                  <div className="inline-block w-[50%] flex flex-col">
                    <div>{summary.username}</div>
                    {ft.user.map((player_id) => {
                      return (
                        <div key={player_id}>
                          {allplayers[player_id]?.full_name || player_id}
                        </div>
                      );
                    })}
                  </div>
                  <p>FOR</p>
                  <div className="inline-block w-[50%]">
                    {summary.lm_username}
                    {ft.lm.map((player_id) => {
                      return (
                        <div key={player_id}>
                          {allplayers[player_id]?.full_name || player_id}
                        </div>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
