import React, { useState } from "react";
import { PageHeader, FormGroup, FormControl, Table, ControlLabel, Button } from "react-bootstrap";
import { onError } from "../libs/errorLib";
import "./Home.css";
import axios from 'axios';
import LoaderButton from "../components/LoaderButton";

export default function Home() {
  const [animeList, setAnimeList] = useState(null);
  const [userList, setUserList] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sortKey, setSortKey] = useState("mostwatched");

  function loadAnimes(arr) {
    const baseUrl = "https://cors-anywhere.herokuapp.com/http://flask-env-4.eba-hgbzmtmf.ap-southeast-1.elasticbeanstalk.com";
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

  function renderRatings(anime, i) {
    let arr = [];
    let j = 1;
    for (let key in userList) {
      const y = anime.rates[userList[key]] || '-';
      arr.push(<td key={`row-num-${i}-${j}`}>{y}</td>);
      j += 1;
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
      arr.push(<tr key={`row-num-${i}`}>
                  <td key={`row-num-${i}-1st`}>
                    {i}
                  </td>
                  <td key={`row-num-${i}-2nd`}>
                    {anime.anime_title}
                  </td>
                  {renderRatings(anime, i)}
                  <td key={`row-num-${i}-last`}>
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

  function sortAnime(data, prop, asc, mostWatched = false) {
    let tempArr = [];
    let temp = data;
    for (let key in temp) {
      tempArr.push(temp[key]);
    }

    if (mostWatched) {
      tempArr.sort(function(a, b) {
        const tempA = Object.keys(a["rates"]).length;
        const tempB = Object.keys(b["rates"]).length;
        return (tempB > tempA) ? 1 : ((tempB < tempA) ? -1 : 0);
      });
    } else {
      tempArr.sort(function(a, b) {
        if (asc) {
          return (a[prop] > b[prop]) ? 1 : ((a[prop] < b[prop]) ? -1 : 0);
        } else {
            return (b[prop] > a[prop]) ? 1 : ((b[prop] < a[prop]) ? -1 : 0);
        }
      });
    }

    let tempJson = {};
    let n = 0;
    tempArr.forEach(element => {
      tempJson[`${n}`] = element;
      n += 1;
    });

    return tempJson;
  }

  async function handleQuerySubmit(event) {
    event.preventDefault();
    try {
      setIsLoading(true);
      let arr = userInput.split(",").map(function(item) { return item.trim(); });
      setUserList(arr);

      const myAnimeList = await loadAnimes(arr);
      // const tempJson = sortAnime(myAnimeList.data, "anime_title", true);
      const tempJson = sortAnime(myAnimeList.data, "", true, true);
      setAnimeList(tempJson);
    } catch (e) {
      onError(e);
    }
    setIsLoading(false);
  }

  function handleSortTitle(event) {
    event.preventDefault();
    const tempJson = sortAnime(animeList, "anime_title", true);
    setAnimeList(tempJson);
    setSortKey("title");
  }

  function handleSortMostWatched(event) {
    event.preventDefault()
    const tempJson = sortAnime(animeList, "", true, true);
    setAnimeList(tempJson);
    setSortKey("mostwatched");
  }

  return (
    <div className="Home">
      <div className="animes">
        <PageHeader>Anime User Ratings</PageHeader>
        <FormGroup controlId="query" bsSize="large">
          <ControlLabel>Usernames, separate with commas</ControlLabel>
          <FormControl
            autoFocus
            type="text"
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
        {
          animeList &&
          <FormGroup>
            <ControlLabel id='sort'>Sort By </ControlLabel><br />
            <Button
              name='title' 
              onClick={handleSortTitle}
              checked={false}
              disabled={sortKey === "title"}
              >
                Title
            </Button>{' '}
            <Button
              name='mostwatched' 
              onClick={handleSortMostWatched}
              disabled={sortKey === "mostwatched"}
              >
                Most Watched
            </Button>{' '}
          </FormGroup>
        }

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