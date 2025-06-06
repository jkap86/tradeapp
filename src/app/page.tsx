"use client";

import Allplayers from "@/lib/allplayers.json";
import { League, LeagueDetail, User, Roster } from "@/lib/types";
import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";

const allplayers: { [key: string]: { [key: string]: string } } =
  Object.fromEntries(
    Allplayers.data.map((player_obj: { [key: string]: string }) => [
      player_obj.player_id,
      player_obj,
    ])
  );

export default function Home() {
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
  const [selectedPlayers, setSelectedPlayers] = useState<
    { player_id: string; manager: "u" | "l" }[]
  >([]);
  const [identifier, setIdentifier] = useState("");
  const [copied, setCopied] = useState(false);

  const userRoster = leagueDetail.rosters.find(
    (roster) => roster.user_id === userLeagues.user_id
  );

  const lmRoster = leagueDetail.rosters.find(
    (roster) => roster.roster_id === selectedLeaguemate.roster_id
  );

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
      if (selectedPlayers.length < 15) {
        setSelectedPlayers((prevState) => [
          ...prevState,
          {
            player_id,
            manager: userRoster?.players.includes(player_id) ? "u" : "l",
          },
        ]);
      }
    } else {
      setSelectedPlayers((prevState) =>
        prevState.filter((x) => x.player_id !== player_id)
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

    setIdentifier(response.data);
    // router.push(`/rank/${response.data}/u`);
  };

  useEffect(() => {
    setSelectedPlayers([]);
  }, [selectedLeaguemate]);

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
      <table className="w-1/2 table-fixed align-top">
        <tbody>
          {(roster?.players || [])
            .sort((a, b) => getPositionValue(a) - getPositionValue(b))
            .map((player_id) => {
              return (
                <tr
                  key={player_id}
                  className={
                    selectedPlayers.some((sp) => sp.player_id === player_id)
                      ? `outline outline-green-500`
                      : ""
                  }
                  onClick={() =>
                    modifySelectedPlayers(
                      player_id,
                      !selectedPlayers.some((sp) => sp.player_id === player_id)
                    )
                  }
                >
                  <td>{allplayers[player_id]?.position || "-"}</td>
                  <td>{allplayers[player_id]?.full_name || player_id}</td>
                  <td>{allplayers[player_id]?.team || "FA"}</td>
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
                <tr
                  key={`${pick.season}_${pick.round}_${pick.roster_id}`}
                  className={
                    selectedPlayers.some((sp) => sp.player_id === pick_name)
                      ? `outline outline-green-500`
                      : ""
                  }
                  onClick={() =>
                    modifySelectedPlayers(
                      pick_name,
                      !selectedPlayers.some((sp) => sp.player_id === pick_name)
                    )
                  }
                >
                  <td colSpan={3}>
                    {pick_name.replace(`(${roster?.username})`, "")}
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
        <div className="flex flex-col m-8 items-center">
          <label>Enter Your Sleeper Username</label>
          <input
            className="w-[15rem] text-center"
            type="text"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded w-[15rem]"
            onClick={() => fetchUserLeagues()}
          >
            Fetch Leagues
          </button>
        </div>

        {userLeagues.user_id && (
          <div className="flex flex-col m-8 items-center text-center">
            <label>Select League to find trades in</label>
            <select
              onChange={(e) => setSelectedLeagueId(e.target.value)}
              className="w-[15rem] text-center"
            >
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
              className="bg-blue-600 text-white px-3 py-1 rounded w-[15rem]"
              disabled={selectedLeagueId === ""}
              onClick={fetchLeagueDetail}
            >
              Fetch Rosters
            </button>
          </div>
        )}

        {leagueDetail.league_id && (
          <div className="flex flex-col m-8 items-center text-center">
            <label>Select a Leaguemate to trade with</label>
            <select
              className="w-[15rem] text-center"
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
          <div className="flex flex-col items-center text-center">
            <label>
              Select 5-15 players total from both teams that you are interested
              in including in a trade.
            </label>
            <br />
            <br />
            <em>{selectedPlayers.length} selected</em>
            <br /> <br />
            <div className="flex flex-col items-center">
              <div className="flex">
                {getRosterTable(userRoster)}
                {getRosterTable(lmRoster)}
              </div>
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded w-[15rem]"
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

        {identifier && (
          <div className="flex flex-col items-center">
            <div className="flex flex-col m-8">
              <label>
                Send Leaguemate this link for them to rank these players
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={`${
                    typeof window !== "undefined" ? window.location.origin : ""
                  }/rank/${identifier}/l`}
                  readOnly
                  className="border px-2 py-1 w-full"
                />
                <button
                  className="bg-blue-600 text-white px-3 py-1 rounded"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        `${
                          typeof window !== "undefined"
                            ? window.location.origin
                            : ""
                        }/rank/${identifier}/l`
                      );

                      setCopied(true);

                      setTimeout(() => setCopied(false), 2000);
                    } catch {
                      console.error("Failed to copy");
                    }
                  }}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <Link
              href={`${
                typeof window !== "undefined" ? window.location.origin : ""
              }/rank/${identifier}/u`}
            >
              Link for you to rank these players
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
