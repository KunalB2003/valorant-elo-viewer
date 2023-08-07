"use client";

import styles from './page.module.css'
import { useEffect, useState } from 'react';

const fetcher = (...args) => fetch(...args).then((res) => res.json());

async function getInfo(region, username, tag, setInfo, setRankedInfo, setRecentRanked) {
  let userInfo = await getUserInfo(username, tag);

  setInfo(info => ({ ...userInfo.data }))
  getRankedInfo(region, username, tag).then(data_ => {
    setRankedInfo(rankedInfo => ({ ...data_.data }))
  })
  getRecentRanked(region, username, tag).then(data_ => {
    setRecentRanked(recentRanked => ([...data_.data.slice(0, 5)]))
    // console.log(data_.data)
  })
}
async function getUserInfo(username, tag) {
  return fetcher(
    `https://api.henrikdev.xyz/valorant/v1/account/${username}/${tag}`
  );
}

async function getRankedInfo(region, username, tag) {
  return fetcher(
    `https://api.henrikdev.xyz/valorant/v1/mmr/${region}/${username}/${tag}`
  );
}

async function getRecentRanked(region, username, tag) {
  return fetcher(
    `https://api.henrikdev.xyz/valorant/v1/mmr-history/${region}/${username}/${tag}`
  );
}


export default function Page({ params }) {
  if (params['slug'].length != 3) {
    return <div className="error">
      <h2>Error: Incorrect URL format</h2>
      <p>Correct usage: /data/region/username/tag</p>
    </div>
  }
  const [info, setInfo] = useState({});
  const [rankedInfo, setRankedInfo] = useState({});
  const [recentRanked, setRecentRanked] = useState([])
  const [region, username, tag] = params["slug"];
  // console.log(region, username, tag)

  // eventually want to use puuid instead of username and tag
  useEffect( async () => {
    await getInfo(region, username, tag, setInfo, setRankedInfo, setRecentRanked)

  }, []);

  return (
    <div>
      <div className={styles["gap"]}></div>
      <div className={styles["card"]}>
        {JSON.stringify(info) == '{}' || JSON.stringify(rankedInfo) == '{}' ? (
          <span>
            <div className={styles["gap"]}></div>
            <div className={styles["loader"]}></div>
          </span>
        ) : (
          <div>
            <div className={styles["info"]}>
              <h1> {username}#{tag} </h1>
              <span>
                <img src={rankedInfo["images"]["small"]} />
                <h3>{rankedInfo["currenttierpatched"]} - {rankedInfo["ranking_in_tier"]}RR</h3>
              </span>
              {<div className={styles["recentRanked"]}>
                {recentRanked.map(match => <div key={match.match_id} className={(match.mmr_change_to_last_game < 0 ? styles["loss"] : styles["win"])}>{match.mmr_change_to_last_game}</div>)}
              </div>}
            </div>
            <img className={styles["card_img"]} src={info["card"]["large"]} />
          </div>
        )}
      </div>
    </div>
  );

  // return <div>{JSON.stringify(params, null, 2)}</div>
}

