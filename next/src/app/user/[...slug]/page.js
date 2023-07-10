"use client";

import styles from './page.module.css'
import { useEffect, useState } from 'react';

async function getUserInfo(username, tag) {
    return fetch(
      `https://api.henrikdev.xyz/valorant/v1/account/${username}/${tag}`
    ).then((res) => res.json());
}

async function getRankedInfo(region, username, tag) {
    return fetch(
      `https://api.henrikdev.xyz/valorant/v1/mmr/${region}/${username}/${tag}`
    ).then((res) => res.json());
}

async function getRecentRanked(region, username, tag) {
    return fetch(
        `https://api.henrikdev.xyz/valorant/v1/mmr-history/${region}/${username}/${tag}`
    ).then((res) => res.json());
}


export default function Page({params}) {
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
    useEffect(() => {
        getUserInfo(username, tag).then(data => {
            // console.log(data); 
            // puuid, region, account level, name, tag, card: { small, large, wide}
            // info = data.data;
            setInfo( info => ({...info, ...data.data}));
        }).then( () =>{ 
            getRankedInfo(region, username, tag).then(data_ => {
                // console.log(data);
                setRankedInfo( rankedInfo => ({...rankedInfo, ...data_.data}))
            })
            getRecentRanked(region, username, tag).then(data_ => {
                setRecentRanked(recentRanked => ([...recentRanked, ...data_.data]))
            })
        })
    }, []);


    return (
      <div className={styles["card"]}>
        {JSON.stringify(info) == '{}' || JSON.stringify(rankedInfo) == '{}' ? (
          <div> loading...</div>
        ) : (
          <div>
            <div className={styles["info"]}>
              <h1>
                {username}#{tag}
              </h1>
              <span>
                    <img src={rankedInfo["images"]["small"]} />
                  
                  <h3>
                    {/* {JSON.stringify(rankedInfo, null, 2)} */}
                    {rankedInfo["currenttierpatched"]} - {rankedInfo["ranking_in_tier"]}RR
                  </h3>
              </span>
              {/* over here loop over the past 0-5 comps and display them in circles
            green for wins, red for losses
            also include the rr gained/lost */}
            </div>
            {/* {JSON.stringify(info, null, 2)} */}
            <img className={styles["card_img"]} src={info["card"]["large"]}/>
          </div>
        )}
      </div>
    );

    // return <div>{JSON.stringify(params, null, 2)}</div>
}

