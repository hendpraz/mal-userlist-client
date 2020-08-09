import React, { useState } from "react";
import { PageHeader, Table, Button } from "react-bootstrap";
import { onError } from "../libs/errorLib";
import "./Home.css";

export default function Home() {
  const [animeList, setAnimeList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [page, setPage] = useState(1);

  function loadAnimes() {
    
  }

  function handleSubmitUsername(event) {
    event.preventDefault();
    try {
      let arr = s.split(",").map(function(item) { return item.trim(); });
      setUserList(arr);

      const myAnimeList = await loadAnimes(arr);
      setAnimeList(myAnimeList);
    } catch (e) {
      onError(e);
    }
  }

  function renderAnimeList(animeList) {
    let x = [{}].concat(animeList).map((anime, i) =>
      i !== 0 &&
        <tr>
          <td>
            {i}
          </td>
          <td>
            {anime.anime_title}
          </td>
          {() => {
            
          }}
          <td>
            {anime.rates[userList[0]]}
          </td>
          <td>
            {anime.rates[userList[1]]}
          </td>
          <td>
            {anime.rates[userList[2]]}
          </td>
          <td>
            {anime.rates[userList[3]]}
          </td>
          <td>
            {anime.rates[userList[4]]}
          </td>
          <td>
            {() => {
              avg = 0;
              n = 0;

              for (key in anime.rates) {
                avg += anime.rates[key];
                n += 1;
              }
              avg /= n;
              return avg.toFixed(2)
            }}
          </td>
        </tr>
    );
    x.shift();
    return x;
  }

  function renderUserTableHead(userList) {
    let x = [{}].concat(userList).map((user, i) =>
    i !== 0 &&
      <th>{user}</th>
    );
    x.shift();
    return x;
  }

  return (
    <div className="Home">
      <div className="animes">
        <PageHeader>Rating Anime</PageHeader>
        <Button color="secondary" onClick={handlePrevAnime}>Sebelumnya</Button>
        <Button color="primary" onClick={handleNextAnime}>Berikutnya</Button>
        <Table>
          <thead>
            <tr>
              <th>Nomor</th>
              <th>Judul Anime</th>
              { userList && renderUserTableHead(userList) }
              <th>Avg</th>
            </tr>
          </thead>
          <tbody>
            {animeList && renderAnimeList(animeList)}
          </tbody>
        </Table>
          
      </div>
    </div>
  );
}