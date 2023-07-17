"use client";
import styles from "./page.module.css";

import UserCard from "../components/UserCard";

import Link from "next/link";

const fetcher = (...args) => fetch(...args).then((res) => res.json());

export default async function Page() {
    let users = null;
    users = await fetcher(`${process.env.NEXT_PUBLIC_API_URL}/tracked`);
    return (
        <div>
            <h1>Select a user to view:</h1>
            {users == null ? (
                <div>loading...</div>
            ) : (
                <ul className={styles["player-cards"]}>
                    {users.map((user) => (
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
