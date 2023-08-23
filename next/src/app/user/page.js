"use client";
import styles from "./page.module.css";

import UserCard from "../components/UserCard";

import Link from "next/link";

import { useState, useEffect } from "react";

const fetcher = (...args) => fetch(...args).then((res) => res.json());

export default function Page() {
  const [playerList, setPlayerList] = useState(null);
  const [search, setSearch] = useState("");
  const [queryStatus, setQueryStatus] = useState("");

  function addPlayer(search) {
    // send request to add player
    console.log(search);
    // try to split player up by the tag
    // format should be as follows:
    // username # tag
    let username = search.split("#")[0] || "";
    let tag = search.split("#")[1] || "";
    let body = { username, tag, region: "na" };
    console.log(body)
  
    //TODO: add region to the search
  
    fetcher(`${process.env.NEXT_PUBLIC_API_URL}/trackPlayer`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((data) => {
      if (data.status == 200) {
        setQueryStatus(data.message);
        getPlayerList();
        setSearch("");
      } else {
        setQueryStatus((data.message ? data.message : "Error"));
      }
    })
  }

  function getPlayerList() {
    fetcher(`${process.env.NEXT_PUBLIC_API_URL}/tracked`).then((data) => {
      setPlayerList(data);
    });
  }

  useEffect(() => {
    getPlayerList();
  }, []);

  return (
    <div>
      <h1>Select a user to view:</h1>
      {playerList == null ? (
        <div>loading...</div>
      ) : (
        <ul className={styles["player-cards"]}>
          {playerList.map((user) => (
            <li key={user.puuid}>
              <Link href={`user/${user.region}/${user.username}/${user.tag}`}>
                <UserCard user={user} key={user.puuid} />
              </Link>
            </li>
          ))}
          <li>
            {/* add a player here 
              // TODO: add region to the search 
            */}
            <div className={styles["add_player"]}>
              <input
                type="text"
                className={styles["player_search"]}
                placeholder="Add a new player, e.g. player#NA1"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  addPlayer(search);
                }}
              >
                Search
              </button>
              <div>{queryStatus}</div>
            </div>
          </li>
        </ul>
      )}
    </div>
  );
}
