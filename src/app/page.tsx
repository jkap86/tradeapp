"use client";

import Allplayers from "@/lib/allplayers.json";
import { League, LeagueDetail, User, Roster } from "@/lib/types";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const allplayers: { [key: string]: { [key: string]: string } } =
  Object.fromEntries(
    Allplayers.data.map((player_obj: { [key: string]: string }) => [
      player_obj.player_id,
      player_obj,
    ])
  );

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [userLeagues, setUserLeagues] = useState<User>({
    user_id: "",
    username: "",
    avatar: "",
    leagues: [],
  });
  const [selectedLeagueId, setSelectedLeagueId] = useState("");
  const [leagueDetail, setLeagueDetail] = useState<LeagueDetail>({
    league_id: "",
    avatar: "",
    name: "",
    rosters: [],
  });
  const [selectedLeaguemate, setSelectedLeaguemate] = useState<{
    user_id: string;
    username: string;
    avatar: string;
    roster_id: number;
  }>({
    user_id: "",
    username: "",
    avatar: "",
    roster_id: 0,
  });
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [identifier, setIdentifier] = useState("");

  const fetchUserLeagues = async () => {
    const response = await axios.get("/api/user", {
      params: {
        username,
      },
    });

    setUserLeagues(response.data);
  };

  const fetchLeagueDetail = async () => {
    const response = await axios.get("/api/league", {
      params: {
        league_id: selectedLeagueId,
      },
    });

    setLeagueDetail(response.data);
  };

  const modifySelectedPlayers = (player_id: string, checked: boolean) => {
    if (checked) {
      setSelectedPlayers((prevState) => [...prevState, player_id]);
    } else {
      setSelectedPlayers((prevState) =>
        prevState.filter((x) => x !== player_id)
      );
    }
  };

  const submitPlayers = async () => {
    const response = await axios.post("/api/submitplayers", {
      selectedPlayers,
      user_id: userLeagues.user_id,
      username: userLeagues.username,
      league_id: leagueDetail.league_id,
      league_name: leagueDetail.name,
      lm_user_id: selectedLeaguemate.user_id,
      lm_username: selectedLeaguemate.username,
    });

    router.push(`/rank/${response.data}/u`);
  };

  useEffect(() => {
    setSelectedPlayers([]);
  }, [selectedLeaguemate]);

  const userRoster = leagueDetail.rosters.find(
    (roster) => roster.user_id === userLeagues.user_id
  );

  const lmRoster = leagueDetail.rosters.find(
    (roster) => roster.roster_id === selectedLeaguemate.roster_id
  );

  const selectLeaguemate = (roster_id: number) => {
    const lmRoster = leagueDetail.rosters.find(
      (r) => r.roster_id === roster_id
    );

    if (lmRoster) {
      setSelectedLeaguemate({
        user_id: lmRoster.user_id,
        username: lmRoster.username,
        avatar: lmRoster.avatar,
        roster_id: roster_id,
      });
    }
  };

  const getPositionValue = (player_id: string) => {
    const position = allplayers && allplayers[player_id]?.position;

    switch (position) {
      case "QB":
        return 1;
      case "RB":
        return 2;
      case "FB":
        return 2;
      case "WR":
        return 3;
      case "TE":
        return 4;
      default:
        return 5;
    }
  };

  const getRosterTable = (roster: Roster | undefined) => {
    return (
      <table>
        <tbody>
          {(roster?.players || [])
            .sort((a, b) => getPositionValue(a) - getPositionValue(b))
            .map((player_id) => {
              return (
                <tr key={player_id}>
                  <td>{allplayers[player_id]?.full_name || player_id}</td>
                  <td>
                    <input
                      type="checkbox"
                      disabled={
                        !selectedPlayers.includes(player_id) &&
                        selectedPlayers.length === 15
                      }
                      checked={selectedPlayers.includes(player_id)}
                      onChange={(e) =>
                        modifySelectedPlayers(player_id, e.target.checked)
                      }
                    />
                  </td>
                </tr>
              );
            })}
          {(roster?.draftpicks || [])
            .sort(
              (a, b) =>
                a.season - b.season ||
                a.round - b.round ||
                (a.order || 0) - (b.order || 0)
            )
            .map((pick) => {
              const pick_name = pick.order
                ? `${pick.season} ${pick.round}.${pick.order.toLocaleString(
                    "en-US",
                    {
                      minimumIntegerDigits: 2,
                    }
                  )}`
                : `${pick.season} Round ${pick.round} ${`(${
                    pick.original_user.username +
                    (pick.original_user.username === "Orphan"
                      ? `_${pick.roster_id}`
                      : "")
                  })`}`;
              return (
                <tr key={`${pick.season}_${pick.round}_${pick.roster_id}`}>
                  <td>{pick_name.replace(`(${roster?.username})`, "")}</td>
                  <td>
                    <input
                      type="checkbox"
                      disabled={
                        !selectedPlayers.includes(pick_name) &&
                        selectedPlayers.length === 15
                      }
                      checked={selectedPlayers.includes(pick_name)}
                      onChange={(e) =>
                        modifySelectedPlayers(pick_name, e.target.checked)
                      }
                    />
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    );
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <h1>Trade App</h1>

      <div className="flex flex-col h-full justify-evenly">
        <div className="flex flex-col m-8">
          <label>Enter Your Sleeper Username</label>
          <input
            type="text"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button onClick={() => fetchUserLeagues()}>Submit</button>
        </div>

        {userLeagues.user_id && (
          <div className="flex flex-col m-8">
            <label>Select League to find trades in</label>
            <select onChange={(e) => setSelectedLeagueId(e.target.value)}>
              <option value="" hidden>
                Select League
              </option>
              {userLeagues.leagues.map((league: League) => {
                return (
                  <option key={league.league_id} value={league.league_id}>
                    {league.name}
                  </option>
                );
              })}
            </select>
            <button
              disabled={selectedLeagueId === ""}
              onClick={fetchLeagueDetail}
            >
              Fetch
            </button>
          </div>
        )}

        {leagueDetail.league_id && (
          <div className="flex flex-col m-8">
            <label>Select a Leaguemate to trade with</label>
            <select
              value={selectedLeaguemate.roster_id}
              onChange={(e) => selectLeaguemate(parseInt(e.target.value))}
            >
              <option value="" hidden>
                Select Leaguemate
              </option>
              {leagueDetail.rosters
                .filter((roster) => roster.user_id !== userLeagues.user_id)
                .map((roster) => {
                  return (
                    <option key={roster.roster_id} value={roster.roster_id}>
                      {roster.username}
                    </option>
                  );
                })}
            </select>
          </div>
        )}

        {selectedLeaguemate.roster_id > 0 && (
          <div className="flex flex-col m-8">
            <label>
              Select 5-15 players total from both teams that you are interested
              in including in a trade.
            </label>
            <br />
            <br />
            <em>{selectedPlayers.length} selected</em>
            <br /> <br />
            <div className="flex flex-col">
              <div className="flex justify-evenly">
                {getRosterTable(userRoster)}
                {getRosterTable(lmRoster)}
              </div>
              <button
                onClick={() => {
                  if (
                    selectedPlayers.length >= 5 &&
                    selectedPlayers.length <= 15
                  ) {
                    submitPlayers();
                  } else {
                    alert(
                      `Select ${5 - selectedPlayers.length}-${
                        15 - selectedPlayers.length
                      } more players`
                    );
                  }
                }}
              >
                Submit Players
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
