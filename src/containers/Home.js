import React, { useState, useEffect } from "react";
import {
  PageHeader,
  FormGroup,
  FormControl,
  Table,
  ControlLabel,
  Button,
  Grid,
  Row,
  Col,
} from "react-bootstrap";
import { onError } from "../libs/errorLib";
import "./Home.css";
import axios from "axios";
import LoaderButton from "../components/LoaderButton";
import { useHistory } from "react-router-dom";
import { withRouter } from "react-router";

function Home(props) {
  const history = useHistory();
  const [animeList, setAnimeList] = useState(null);
  const [userList, setUserList] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sortKey, setSortKey] = useState("mostwatched");

  useEffect(() => {
    async function onLoad() {
      try {
        setIsLoading(true);
        let query = props.location.search;
        if (query) {
          query = query.split("=");
          query.shift();
          setUserInput(query[0]);

          let arr = query[0].split(",").map(function (item) {
            return item.trim();
          });
          setUserList(arr);
        }
      } catch (e) {
        onError(e);
      }
      setIsLoading(false);
    }

    onLoad();
  }, [props]);

  function loadAnimes(arr) {
    // const baseUrl = "https://cors-anywhere.herokuapp.com/";
    // const apiUrl = "http://mal-api-v1-06.eba-hgbzmtmf.ap-southeast-1.elasticbeanstalk.com";

    const apiUrl =
      "https://etq478rc1c.execute-api.ap-southeast-1.amazonaws.com";
    const path = "/anime-stats";
    return axios({
      method: "post",
      url: `${apiUrl + path}`,
      data: {
        username_list: arr,
      },
    });
  }

  function renderRatings(anime, i) {
    let arr = [];
    let j = 1;
    for (let key in userList) {
      const y = anime.rates[userList[key]] || "-";
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
      arr.push(
        <tr key={`row-num-${i}`}>
          <td key={`row-num-${i}-1st`}>{i}</td>
          <td key={`row-num-${i}-2nd`}>{anime.anime_title}</td>
          {renderRatings(anime, i)}
          <td key={`row-num-${i}-last`}>{anime.avg.toFixed(2)}</td>
        </tr>
      );
    }
    let x = [{}].concat(arr);
    x.shift();
    return [x];
  }

  function renderUserTableHead(userList) {
    let x = [{}]
      .concat(userList)
      .map((user, i) => i !== 0 && <th key={`head-${i}`}>{user}</th>);
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
      tempArr.sort(function (a, b) {
        const tempA = Object.keys(a["rates"]).length;
        const tempB = Object.keys(b["rates"]).length;
        return tempB > tempA ? 1 : tempB < tempA ? -1 : 0;
      });
    } else {
      tempArr.sort(function (a, b) {
        if (asc) {
          return a[prop] > b[prop] ? 1 : a[prop] < b[prop] ? -1 : 0;
        } else {
          return b[prop] > a[prop] ? 1 : b[prop] < a[prop] ? -1 : 0;
        }
      });
    }

    let tempJson = {};
    let n = 0;
    tempArr.forEach((element) => {
      tempJson[`${n}`] = element;
      n += 1;
    });

    return tempJson;
  }

  async function handleQuerySubmit(event) {
    event.preventDefault();
    try {
      setIsLoading(true);
      let arr = userInput.split(",").map(function (item) {
        return item.trim();
      });
      setUserList(arr);

      const myAnimeList = await loadAnimes(arr);
      // Sort by Most Watched + Rating
      let tempJson = sortAnime(myAnimeList.data, "avg", false);
      tempJson = sortAnime(tempJson, "", true, true);
      setAnimeList(tempJson);
      setSortKey("mwavg");
      history.push(`/?input=${arr.join(",")}`);
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

  function handleSortAverage(event) {
    event.preventDefault();
    const tempJson = sortAnime(animeList, "avg", false);
    setAnimeList(tempJson);
    setSortKey("highavg");
  }

  function handleSortMWAvg(event) {
    event.preventDefault();
    let tempJson = sortAnime(animeList, "avg", false);
    tempJson = sortAnime(tempJson, "", true, true);
    setAnimeList(tempJson);
    setSortKey("mwavg");
  }

  function handleSortMWTitle(event) {
    event.preventDefault();
    let tempJson = sortAnime(animeList, "anime_title", true);
    tempJson = sortAnime(tempJson, "", true, true);
    setAnimeList(tempJson);
    setSortKey("mwtitle");
  }

  return (
    <div className="Home">
      <div className="animes">
        <PageHeader>Anime User Ratings Comparison</PageHeader>
        <Grid>
          <Row>
            <Col sm={12} md={9} xs={12}>
              <FormGroup controlId="query" bsSize="large">
                <FormControl
                  autoFocus
                  type="text"
                  onChange={(e) => setUserInput(e.target.value)}
                  value={userInput}
                  placeholder="username1, username2, username3"
                />
              </FormGroup>
            </Col>
            <Col sm={12} md={3} xs={12}>
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
            </Col>
          </Row>
        </Grid>
        {animeList && (
          <FormGroup>
            <ControlLabel id="sort">Sort By </ControlLabel>
            <br />
            <Button
              name="title"
              onClick={handleSortTitle}
              checked={false}
              disabled={sortKey === "title"}
            >
              Title
            </Button>{" "}
            <Button
              name="mostwatched"
              onClick={handleSortMWTitle}
              disabled={sortKey === "mwtitle"}
            >
              Most Watched + Title
            </Button>{" "}
            <Button
              name="mostwatched"
              onClick={handleSortMWAvg}
              disabled={sortKey === "mwavg"}
            >
              Most Watched + Score
            </Button>{" "}
            <Button
              name="mostwatched"
              onClick={handleSortAverage}
              disabled={sortKey === "highavg"}
            >
              Highest Score
            </Button>{" "}
          </FormGroup>
        )}

        <Table>
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              {userList && renderUserTableHead(userList)}
              <th>Avg</th>
            </tr>
          </thead>
          <tbody>{animeList && renderAnimeList(animeList)}</tbody>
        </Table>
      </div>
    </div>
  );
}

export default withRouter(Home);
