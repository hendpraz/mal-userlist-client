import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";
import { onError } from "../libs/errorLib";
import "./Home.css";

const API_URL =
  "https://9iughv024e.execute-api.ap-southeast-1.amazonaws.com/anime-stats";
const MAX_USERS = 6;

function Icon({ name, size = 20 }) {
  const paths = {
    arrow: <path d="M5 12h14M14 6l6 6-6 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    close: <path d="M6 6l12 12M18 6L6 18" />,
    users: (
      <>
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </>
    ),
    spark: (
      <>
        <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" />
        <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
      </>
    ),
    trophy: (
      <>
        <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 01-10 0V4z" />
        <path d="M7 6H4v1a4 4 0 004 4M17 6h3v1a4 4 0 01-4 4" />
      </>
    ),
    play: <path d="M8 5l11 7-11 7V5z" />,
    pause: <path d="M8 5v14M16 5v14" />,
    back: <path d="M19 12H5M10 18l-6-6 6-6" />,
    external: <path d="M14 3h7v7M10 14L21 3M21 14v6a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1h6" />,
  };

  return (
    <svg
      aria-hidden="true"
      className="icon"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
        {paths[name]}
      </g>
    </svg>
  );
}

function getScore(anime, username) {
  const rates = anime.rates || {};
  if (Object.prototype.hasOwnProperty.call(rates, username)) return rates[username];
  const matchingKey = Object.keys(rates).find(
    (key) => key.toLowerCase() === username.toLowerCase()
  );
  return matchingKey ? rates[matchingKey] : null;
}

function watchedCount(anime, usernames) {
  return usernames.filter((username) => getScore(anime, username) !== null).length;
}

function ratedCount(anime, usernames) {
  return usernames.filter((username) => Number(getScore(anime, username)) > 0).length;
}

function buildSlides(animes, usernames) {
  if (!animes.length || usernames.length < 2) return [];

  const fullyRated = animes
    .filter((anime) => ratedCount(anime, usernames) === usernames.length)
    .sort((a, b) => b.avg - a.avg);

  const closestMatch = [...animes].sort((a, b) => {
    const countDifference = ratedCount(b, usernames) - ratedCount(a, usernames);
    return countDifference || b.avg - a.avg;
  })[0];
  const consensus = fullyRated[0] || closestMatch;
  const consensusScores = usernames
    .map((username) => ({ username, score: getScore(consensus, username) }))
    .filter(({ score }) => Number(score) > 0);

  const slides = [
    {
      type: "consensus",
      eyebrow: fullyRated.length ? "THE GROUP HAS SPOKEN" : "YOUR CLOSEST MATCH",
      title: consensus.anime_title,
      score: Number(consensus.avg).toFixed(1),
      scores: consensusScores,
      description: fullyRated.length
        ? `The highest-rated title every member of your crew scored.`
        : `The strongest overlap across your combined libraries.`,
    },
  ];

  usernames.forEach((username) => {
    const candidates = animes
      .filter((anime) => !Number(getScore(anime, username)))
      .map((anime) => {
        const friendScores = usernames
          .filter((friend) => friend !== username)
          .map((friend) => ({ username: friend, score: getScore(anime, friend) }))
          .filter(({ score }) => Number(score) > 0);
        const average = friendScores.length
          ? friendScores.reduce((total, item) => total + Number(item.score), 0) /
            friendScores.length
          : 0;
        return { anime, friendScores, average };
      })
      .filter((item) => item.friendScores.length && item.average >= 7)
      .sort((a, b) => {
        const supporterDifference = b.friendScores.length - a.friendScores.length;
        return supporterDifference || b.average - a.average;
      });

    if (candidates[0]) {
      const pick = candidates[0];
      slides.push({
        type: "recommendation",
        eyebrow: `CURATED FOR ${username.toUpperCase()}`,
        user: username,
        title: pick.anime.anime_title,
        score: pick.average.toFixed(1),
        scores: pick.friendScores,
        description: `${pick.friendScores.length === 1 ? "A friend loves" : "Your friends love"} this one — and it’s missing from your scored list.`,
      });
    }
  });

  return slides;
}

function DiscoveryModal({ slides, onClose }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const closeButtonRef = useRef(null);
  const slide = slides[activeSlide];

  useEffect(() => {
    if (closeButtonRef.current) closeButtonRef.current.focus();
    const handleKey = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") {
        setActiveSlide((current) => (current + 1) % slides.length);
      }
      if (event.key === "ArrowLeft") {
        setActiveSlide((current) => (current - 1 + slides.length) % slides.length);
      }
    };
    document.body.classList.add("modal-open");
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose, slides.length]);

  useEffect(() => {
    if (!isPlaying || slides.length < 2) return undefined;
    const timer = window.setTimeout(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 5600);
    return () => window.clearTimeout(timer);
  }, [activeSlide, isPlaying, slides.length]);

  function goTo(index) {
    setActiveSlide((index + slides.length) % slides.length);
  }

  return (
    <div className="discovery-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-label="Your anime discoveries"
        aria-live="polite"
        aria-modal="true"
        className={`discovery-modal discovery-modal--${slide.type}`}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="modal-orb modal-orb--one" />
        <div className="modal-orb modal-orb--two" />

        <header className="discovery-header">
          <div className="discovery-brand"><span>✦</span> AniMatch discovery</div>
          <button aria-label="Close discoveries" className="icon-button icon-button--light" onClick={onClose} ref={closeButtonRef}>
            <Icon name="close" />
          </button>
        </header>

        <div className="discovery-progress" aria-label={`Slide ${activeSlide + 1} of ${slides.length}`}>
          {slides.map((item, index) => (
            <button
              aria-label={`Go to slide ${index + 1}`}
              className={`progress-track ${index < activeSlide ? "is-complete" : ""} ${index === activeSlide ? "is-active" : ""}`}
              key={`${item.user || "group"}-${index}`}
              onClick={() => goTo(index)}
            >
              <span key={`${activeSlide}-${isPlaying}`} style={{ animationPlayState: isPlaying ? "running" : "paused" }} />
            </button>
          ))}
        </div>

        <div className="discovery-slide" key={`${slide.title}-${activeSlide}`}>
          <div className="discovery-copy">
            <p className="discovery-eyebrow"><Icon name={slide.type === "consensus" ? "trophy" : "spark"} size={18} /> {slide.eyebrow}</p>
            {slide.type === "recommendation" && (
              <p className="discovery-kicker"><strong>{slide.user}</strong>, you should watch</p>
            )}
            <h2>{slide.title}</h2>
            <p className="discovery-description">{slide.description}</p>
            <div className="friend-scores">
              {slide.scores.map(({ username, score }) => (
                <div className="friend-score" key={username}>
                  <span className="avatar avatar--small">{username.slice(0, 2).toUpperCase()}</span>
                  <span>{username}</span>
                  <strong>{score}/10</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="score-art" aria-label={`Average score ${slide.score} out of 10`}>
            <div className="score-art__spark">✦</div>
            <span className="score-art__label">FRIEND SCORE</span>
            <strong>{slide.score}</strong>
            <span className="score-art__ten">/ 10</span>
            <div className="score-art__title">{slide.title}</div>
          </div>
        </div>

        <footer className="discovery-controls">
          <button className="play-button" onClick={() => setIsPlaying((playing) => !playing)}>
            <Icon name={isPlaying ? "pause" : "play"} size={17} />
            {isPlaying ? "Pause" : "Auto play"}
          </button>
          <span className="slide-count">{String(activeSlide + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span>
          <div className="modal-arrows">
            <button aria-label="Previous discovery" className="round-arrow" onClick={() => goTo(activeSlide - 1)}><Icon name="back" /></button>
            <button aria-label="Next discovery" className="round-arrow round-arrow--next" onClick={() => goTo(activeSlide + 1)}><Icon name="arrow" /></button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function Home() {
  const history = useHistory();
  const [animes, setAnimes] = useState([]);
  const [usernames, setUsernames] = useState([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sortKey, setSortKey] = useState("popular");
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [showDiscoveries, setShowDiscoveries] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  function parseUsernames(value) {
    return value
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function mergeUsernames(items, current = usernames) {
    const merged = [...current];
    items.forEach((item) => {
      if (!merged.some((username) => username.toLowerCase() === item.toLowerCase())) {
        merged.push(item);
      }
    });
    return merged.slice(0, MAX_USERS);
  }

  async function fetchAnimes(users, openModal = true) {
    setIsLoading(true);
    setError("");
    setHasSearched(true);
    setAnimes([]);
    setShowDiscoveries(false);
    try {
      const response = await axios.post(API_URL, { username_list: users });
      const data = Array.isArray(response.data)
        ? response.data
        : Object.keys(response.data || {}).map((key) => response.data[key]);
      if (!data.length) throw new Error("No public anime entries were found for those users.");
      setAnimes(data);
      setSortKey("popular");
      history.push(`/?input=${encodeURIComponent(users.join(","))}`);
      if (openModal && users.length > 1) setShowDiscoveries(true);
    } catch (requestError) {
      onError(requestError);
      const message = requestError.response
        ? "We couldn’t find one of those profiles. Check the spelling and make sure each list is public."
        : requestError.message || "Something went wrong while syncing the libraries.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryUsers = parseUsernames(params.get("input") || "").slice(0, MAX_USERS);
    if (queryUsers.length) {
      setUsernames(queryUsers);
      fetchAnimes(queryUsers, false);
    }
    // Only hydrate a shared URL once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortedAnimes = useMemo(() => {
    const list = [...animes];
    if (sortKey === "title") {
      return list.sort((a, b) => a.anime_title.localeCompare(b.anime_title));
    }
    if (sortKey === "highest") return list.sort((a, b) => b.avg - a.avg);
    if (sortKey === "divisive") {
      return list.sort((a, b) => {
        const spread = (anime) => {
          const scores = usernames.map((user) => Number(getScore(anime, user))).filter(Boolean);
          return scores.length > 1 ? Math.max(...scores) - Math.min(...scores) : -1;
        };
        return spread(b) - spread(a);
      });
    }
    return list.sort((a, b) => {
      const countDifference = watchedCount(b, usernames) - watchedCount(a, usernames);
      return countDifference || b.avg - a.avg;
    });
  }, [animes, sortKey, usernames]);

  const slides = useMemo(() => buildSlides(animes, usernames), [animes, usernames]);
  const sharedCount = animes.filter((anime) => ratedCount(anime, usernames) === usernames.length).length;

  function addDraft() {
    const additions = parseUsernames(draft);
    if (!additions.length) return;
    if (usernames.length >= MAX_USERS) {
      setError(`Keep the crew to ${MAX_USERS} people so the comparison stays readable.`);
      return;
    }
    setUsernames(mergeUsernames(additions));
    setDraft("");
    setError("");
  }

  function handleInputKeyDown(event) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addDraft();
    }
    if (event.key === "Backspace" && !draft && usernames.length) {
      setUsernames((current) => current.slice(0, -1));
    }
  }

  function removeUsername(username) {
    setUsernames((current) => current.filter((item) => item !== username));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const allUsers = mergeUsernames(parseUsernames(draft));
    if (!allUsers.length) {
      setError("Add at least one MyAnimeList username to begin.");
      return;
    }
    setUsernames(allUsers);
    setDraft("");
    fetchAnimes(allUsers);
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 1800);
    } catch (copyError) {
      setError("Couldn’t copy automatically — copy the URL from your browser instead.");
    }
  }

  return (
    <main className="Home">
      <section className="hero" id="compare">
        <div className="hero-shape hero-shape--left">ア</div>
        <div className="hero-shape hero-shape--right">✦</div>
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="eyebrow"><span /> YOUR NEXT OBSESSION, FOUND</p>
            <h1>Where anime<br /><em>tastes collide.</em></h1>
            <p className="hero-subtitle">Bring your crew’s MyAnimeList profiles together. Compare ratings, uncover shared favorites, and find out what everyone should watch next.</p>
          </div>

          <form className="compare-card" onSubmit={handleSubmit}>
            <div className="compare-card__top">
              <span className="step-number">01</span>
              <div>
                <h2>Build your watch crew</h2>
                <p>Add up to {MAX_USERS} public MyAnimeList profiles.</p>
              </div>
            </div>

            <div className={`user-builder ${error ? "has-error" : ""}`}>
              {usernames.map((username, index) => (
                <span className="user-chip" key={username}>
                  <span className={`avatar avatar--${index % 4}`}>{username.slice(0, 2).toUpperCase()}</span>
                  {username}
                  <button aria-label={`Remove ${username}`} onClick={() => removeUsername(username)} type="button"><Icon name="close" size={15} /></button>
                </span>
              ))}
              {usernames.length < MAX_USERS && (
                <input
                  aria-label="MyAnimeList username"
                  autoComplete="off"
                  autoFocus
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder={usernames.length ? "Add another…" : "Type a MAL username…"}
                  value={draft}
                />
              )}
              <button aria-label="Add username" className="add-user" disabled={!draft.trim()} onClick={addDraft} type="button"><Icon name="plus" size={19} /></button>
            </div>
            <div className="input-helper">
              <span>{error || "Press Enter after each username"}</span>
              <span>{usernames.length}/{MAX_USERS} added</span>
            </div>

            <button className="compare-button" disabled={isLoading || (!usernames.length && !draft.trim())} type="submit">
              <span>{isLoading ? `Syncing ${usernames.length || 1} ${usernames.length === 1 ? "library" : "libraries"}…` : "Compare our taste"}</span>
              {isLoading ? <span className="button-spinner" /> : <Icon name="arrow" />}
            </button>

            <div className="privacy-note"><span className="status-dot" /> No login needed · We only read public lists</div>
          </form>
        </div>
      </section>

      {isLoading && (
        <section className="loading-section" aria-live="polite">
          <div className="loading-mark"><span /><span /><span /></div>
          <p>Finding the overlap</p>
          <span>Large libraries can take a few seconds to sync.</span>
        </section>
      )}

      {!hasSearched && !isLoading && (
        <section className="how-it-works" id="how-it-works">
          <div className="section-heading">
            <p className="eyebrow"><span /> HOW IT WORKS</p>
            <h2>Less scrolling.<br /><em>More watching.</em></h2>
          </div>
          <div className="steps-grid">
            <article><span>01</span><Icon name="users" size={32} /><h3>Gather the crew</h3><p>Add everyone’s MAL username as a simple, editable chip.</p></article>
            <article><span>02</span><Icon name="spark" size={32} /><h3>Find your overlap</h3><p>We line up every score and surface the titles you agree on.</p></article>
            <article><span>03</span><Icon name="play" size={32} /><h3>Press play</h3><p>Get a personal watch-next pick powered by your friends’ taste.</p></article>
          </div>
        </section>
      )}

      {animes.length > 0 && !isLoading && (
        <section className="results" id="results">
          <header className="results-header">
            <div>
              <p className="eyebrow"><span /> THE TASTE REPORT</p>
              <h2>Your libraries,<br /><em>decoded.</em></h2>
            </div>
            <div className="result-actions">
              {slides.length > 0 && <button className="outline-button outline-button--dark" onClick={() => setShowDiscoveries(true)}><Icon name="spark" size={18} /> Replay discoveries</button>}
              <button className="outline-button" onClick={copyShareLink}><Icon name="external" size={18} /> {isCopied ? "Link copied!" : "Share report"}</button>
            </div>
          </header>

          <div className="stats-row">
            <div><span>Combined titles</span><strong>{animes.length.toLocaleString()}</strong></div>
            <div><span>Rated by everyone</span><strong>{sharedCount.toLocaleString()}</strong></div>
            <div className="crew-stat"><span>Your crew</span><div>{usernames.map((user, index) => <span className={`avatar avatar--${index % 4}`} key={user}>{user.slice(0, 2).toUpperCase()}</span>)}</div></div>
          </div>

          <div className="table-panel">
            <div className="table-toolbar">
              <div><span>Compare scores</span><small>Unrated titles appear as —</small></div>
              <div className="sort-tabs" aria-label="Sort results">
                {[
                  ["popular", "Most shared"],
                  ["highest", "Top rated"],
                  ["divisive", "Hot takes"],
                  ["title", "A–Z"],
                ].map(([key, label]) => <button className={sortKey === key ? "is-active" : ""} key={key} onClick={() => setSortKey(key)}>{label}</button>)}
              </div>
            </div>
            <div className="table-scroll">
              <table className="ratings-table">
                <thead><tr><th>#</th><th>Anime title</th>{usernames.map((user) => <th key={user}>{user}</th>)}<th>Average</th></tr></thead>
                <tbody>
                  {sortedAnimes.map((anime, index) => (
                    <tr key={`${anime.anime_title}-${index}`}>
                      <td>{String(index + 1).padStart(2, "0")}</td>
                      <td><span className="title-mark">{anime.anime_title.slice(0, 1)}</span><strong>{anime.anime_title}</strong></td>
                      {usernames.map((user) => {
                        const score = getScore(anime, user);
                        return <td key={user}><span className={Number(score) >= 8 ? "score score--high" : "score"}>{Number(score) > 0 ? score : "—"}</span></td>;
                      })}
                      <td><strong className="average-score">{Number(anime.avg).toFixed(1)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <footer className="site-footer">
        <div className="footer-brand"><span>✦</span> ANIMATCH</div>
        <p>Good taste is better shared.</p>
        <a href="#compare">Back to top ↑</a>
      </footer>

      {showDiscoveries && slides.length > 0 && <DiscoveryModal onClose={() => setShowDiscoveries(false)} slides={slides} />}
    </main>
  );
}

export default Home;
