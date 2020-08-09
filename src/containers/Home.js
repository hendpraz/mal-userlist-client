import React, { useState } from "react";
import { PageHeader, FormGroup, FormControl, Table, ControlLabel } from "react-bootstrap";
import { onError } from "../libs/errorLib";
import "./Home.css";
import axios from 'axios';
import LoaderButton from "../components/LoaderButton";

export default function Home() {
  const [animeList, setAnimeList] = useState(null);
  const [userList, setUserList] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function loadAnimes(arr) {
    const baseUrl = "http://localhost:5000";
    const path = "/anime-stats";
    return axios({
      method: 'post',
      url: `${baseUrl+path}`,
      data: {
        username_list: arr
      }
    });
  }

  function renderAverage(anime) {
    let avg = 0;
    let n = 0;

    for (let key in anime.rates) {
      avg += anime.rates[key];
      n += 1;
    }
    avg /= n;
    return avg.toFixed(2);
  }

  function renderRatings(anime) {
    let arr = [];
    for (let key in userList) {
      const y = anime.rates[userList[key]] || '-';
      arr.push(<td>{y}</td>);
    }
    let x = [{}].concat(arr);
    x.shift();
    return [x];
  }

  function renderAnimeList(animeList) {
    let arr = [];
    let i = 0;
    for (let key in animeList) {
      const anime = animeList[key];
      i += 1;
      arr.push(<tr key={`row${i}`}>
                  <td>
                    {i}
                  </td>
                  <td>
                    {anime.anime_title}
                  </td>
                  {renderRatings(anime)}
                  <td>
                  {renderAverage(anime)}
                  </td>
                </tr>);
    }
    let x = [{}].concat(arr);
    x.shift();
    return [x];
  }

  function renderUserTableHead(userList) {
    let x = [{}].concat(userList).map((user, i) =>
    i !== 0 &&
      <th key={`head-${i}`}>{user}</th>
    );
    x.shift();
    return x;
  }

  function validateQueryForm() {
    return userInput.length > 0;
  }

  async function handleQuerySubmit(event) {
    event.preventDefault();
    try {
      setIsLoading(true);
      let arr = userInput.split(",").map(function(item) { return item.trim(); });
      setUserList(arr);

      const myAnimeList = await loadAnimes(arr);
      setAnimeList(myAnimeList.data);
    } catch (e) {
      onError(e);
    }
    setIsLoading(false);
  }

  return (
    <div className="Home">
      <div className="animes">
        <PageHeader>Anime User Ratings</PageHeader>
        <FormGroup controlId="query" bsSize="large">
          <ControlLabel>Usernames, separate with commas</ControlLabel>
          <FormControl
            autoFocus
            type="tel"
            onChange={e => setUserInput(e.target.value)}
            placeholder="Example: username1, username2, username3"
          />
        </FormGroup>
          <LoaderButton
            block
            type="submit"
            bsSize="large"
            isLoading={isLoading}
            disabled={!validateQueryForm()}
            onClick={handleQuerySubmit}
          >
            Submit Username
          </LoaderButton>
        <Table>
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              { userList && renderUserTableHead(userList) }
              <th>Avg</th>
            </tr>
          </thead>
          <tbody>
            { animeList && renderAnimeList(animeList)}
          </tbody>
        </Table>
          
      </div>
    </div>
  );
}