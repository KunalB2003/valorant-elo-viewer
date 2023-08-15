"use client";
import styles from "./page.module.css";

import UserCard from "../components/UserCard";

import Link from "next/link";

import { useState, useEffect } from "react";

const fetcher = (...args) => fetch(...args).then((res) => res.json());

export default function Page() {
  const [playerList, setPlayerList] = useState(null);

  useEffect(() => {
    fetcher(`${process.env.NEXT_PUBLIC_API_URL}/tracked`).then((data) => {
      setPlayerList(data);
    });
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
        </ul>
      )}
    </div>
  );
}
