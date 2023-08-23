"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import styles from "./page.module.css";
import { useEffect, useState } from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const fetcher = (...args) => fetch(...args).then((res) => res.json());



export const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "top",
    },
    title: {
      display: true,
      text: "Chart.js Line Chart",
    },
  },
};

// can generate this based on how far the data goes back / user defined bounds
const labels = ["January", "February", "March", "April", "May", "June", "July"];

// this can be pulled from back end api call
//  grab all data, then add the data in the specified time range to an array for the player
//  => repeat for all players selected
//  maybe can generate a color for each player based on some hashing algorithm
//  this is a list of 64 different colors: ["#000000","#00FF00","#0000FF","#FF0000","#01FFFE","#FFA6FE","#FFDB66","#006401","#010067","#95003A","#007DB5","#FF00F6","#FFEEE8","#774D00","#90FB92","#0076FF","#D5FF00","#FF937E","#6A826C","#FF029D","#FE8900","#7A4782","#7E2DD2","#85A900","#FF0056","#A42400","#00AE7E","#683D3B","#BDC6FF","#263400","#BDD393","#00B917","#9E008E","#001544","#C28C9F","#FF74A3","#01D0FF","#004754","#E56FFE","#788231","#0E4CA1","#91D0CB","#BE9970","#968AE8","#BB8800","#43002C","#DEFF74","#00FFC6","#FFE502","#620E00","#008F9C","#98FF52","#7544B1","#B500FF","#00FF78","#FF6E41","#005F39","#6B6882","#5FAD4E","#A75740","#A5FFD2","#FFB167","#009BFF","#E85EBE"]
//   you can see the colors here: https://codepen.io/nothingexcessive/pen/eYQrOJW

export const data = {
  labels,
  datasets: [
    {
      label: "Dataset 1",
      data: [1, 4, 6, 2, 8, 4, 5],
      borderColor: "rgb(255, 99, 132)",
      backgroundColor: "rgba(255, 99, 132, 0.5)",
    },
    {
      label: "Dataset 2",
      data: [7, 2, 8, 0, 4, 7, 2],
      borderColor: "rgb(53, 162, 235)",
      backgroundColor: "rgba(53, 162, 235, 0.5)",
    },
  ],
};
export default function Page() {
  const [players, setPlayers] = useState(null);
  const [selected, updateSelected] = useState([])
  useEffect(() => {
    fetcher(`${process.env.NEXT_PUBLIC_API_URL}/tracked`).then((res) => {
      setPlayers([...res]);
    });
  }, []);
  // let options = {}
  // let data = {}
  function selectLogic(player) {
    console.log(player.username + " clicked");
    console.log(player)
    if (selected.includes(player)) {
      console.log("already selected, removing")
      updateSelected(selected.filter((item) => item !== player))
    } else {
      console.log("not selected, adding")
      updateSelected([...selected, player])
    }
  }

  return (
    <div className={styles["page"]}>
      <div className={styles["sidebar"]}>
        <div className={styles["player-list"]}>
          {players == null ? (
            <div> loading... </div>
          ) : (
            <ul>
              {players.map((player, index) => {
                return (
                  <li key={index} > 
                    <input type="checkbox" id={index} name={index} onClick={() => selectLogic(player)}/> &nbsp;
                    <label htmlFor={index}>
                      {player.username}#{player.tag}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div>
          {selected.length > 0 ? (selected.map(player => {
            return (<div>{player.username}#{player.tag}</div>)
          })) : ("no players selected")}
        </div>
        <div className={styles["options"]}>
          click me to toggle an options menu
          <ul>
            <li>date range</li>
            <li>elo bounds</li>
            <li>yeah</li>
          </ul>
          {/* 
          existing settings:
            date range
            elo bounds
          extras:
            toggle auto apply
            select all
            deselct all

            */}
        </div>
      </div>

      <div className={styles["chart"]}>
        <Line options={options} data={data}></Line>
      </div>
    </div>
  );
}
