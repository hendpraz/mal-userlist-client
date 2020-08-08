import React, { useState, useEffect } from "react";
import { PageHeader, Table, Button } from "react-bootstrap";
import { onError } from "../libs/errorLib";
import "./Home.css";
import { API } from "aws-amplify";

export default function Home() {
  const limit = 50;
  const [animeList, setAnimeList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function onLoad() {
      function loadAnimes() {
        return API.get("maldataapi", `/anime-stats`);
      }
  
      try {
        setUserList(["Amerph", "baldheart", "DuaKelinci",  "hendpraz", "Qoqom" ])

        const myAnimeList = await loadAnimes();
        setAnimeList(myAnimeList);
      } catch (e) {
        onError(e);
      }
    }
  
    onLoad();
  }, []);

  function renderAnimeList(animeList) {
    let x = [{}].concat(animeList).map((anime, i) =>
      i !== 0 &&
        <tr>
          <td>
            {i + ((page - 1) * limit)}
          </td>
          <td>
            {anime.anime_title}
          </td>
          <td>
            {anime.user_rates[userList[0]]}
          </td>
          <td>
            {anime.user_rates[userList[1]]}
          </td>
          <td>
            {anime.user_rates[userList[2]]}
          </td>
          <td>
            {anime.user_rates[userList[3]]}
          </td>
          <td>
            {anime.user_rates[userList[4]]}
          </td>
          <td>
            {anime.average_score.toFixed(2)}
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

  function loadAnimes(animePage){
    let url = `/anime-stats`;
    if (animePage > 1) {
      url += `?page=${animePage}`;
    }
    return API.get("maldataapi", url);
  }

  async function handleNextAnime(event) {
    event.preventDefault();
    if (animeList.length >= limit) {
      const myAnimeList = await loadAnimes(page + 1);
      setAnimeList(myAnimeList);
      setPage(page + 1);
    }
  }

  async function handlePrevAnime(event) {
    event.preventDefault();

    if (page > 1) {
      const myAnimeList = await loadAnimes(page - 1);
      setAnimeList(myAnimeList);
      setPage(page - 1);
    }
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