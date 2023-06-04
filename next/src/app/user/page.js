'use client';
import styles from './page.module.css'

import UserCard from '../components/UserCard';

import { useRouter } from 'next/navigation';
import Link from 'next/link'; 

const fetcher = (...args) => fetch(...args).then((res) => res.json());
 


export default async function Page() {
    const router = useRouter();
    let users = await fetcher(`${process.env.NEXT_PUBLIC_API_URL}/tracked`)
    return <div>
        <h1>Select a user to view:</h1>
        {/* {JSON.stringify(users, null, 2)} */}
        <ul className={styles["player-cards"]}>
            {users.map(user => <li key={user.puuid} >
                <Link href={`user/${user.region}/${user.username}/${user.tag}`}>
                    <UserCard user={user} key={user.puuid} />
                </Link>
            </li>)}
        </ul>
    </div>
}