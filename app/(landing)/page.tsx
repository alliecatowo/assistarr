import { Check, ExternalLink, Wrench } from "lucide-react";
import Image from "next/image";
import { POSTERS, Poster } from "./posters";
import { ThemeToggle } from "./theme-toggle";

const DEMO_HREF = "/api/auth/guest?redirectUrl=%2Fhome";
const DOCS = "https://alliecatowo.github.io/assistarr/";
const REPO = "https://github.com/alliecatowo/assistarr";

const WALL_ROWS = [
  POSTERS.slice(0, 10),
  [...POSTERS.slice(10), ...POSTERS.slice(0, 2)],
  [...POSTERS.slice(5, 15), ...POSTERS.slice(0, 2)],
  [...POSTERS.slice(14), ...POSTERS.slice(3, 9)],
];

const SERVICES = [
  {
    name: "Radarr",
    role: "Movies",
    tools: ["searchRadarrMovies", "getRadarrQueue", "getRadarrCalendar"],
    poster: 3,
  },
  {
    name: "Sonarr",
    role: "TV",
    tools: ["searchSonarrSeries", "getSonarrQueue", "getSonarrCalendar"],
    poster: 0,
  },
  {
    name: "Jellyfin",
    role: "Your library",
    tools: ["search media", "continue watching", "recently added"],
    poster: 8,
  },
  {
    name: "Jellyseerr",
    role: "Requests",
    tools: ["discovery", "get requests", "request media (asks first)"],
    poster: 12,
  },
  {
    name: "qBittorrent",
    role: "Downloads",
    tools: ["get torrents", "transfer info", "pause / resume (asks first)"],
    poster: 15,
  },
];

const SCREENINGS = [
  {
    key: "chat",
    kicker: "Ask",
    title: "What is downloading right now?",
    body: "The assistant calls the Radarr and Sonarr queue tools, and the tool calls stay visible in the thread. The answer is built from what they returned.",
    h: 600,
    alt: "Assistarr chat answering a download-queue question with Radarr and Sonarr tool calls",
  },
  {
    key: "calendar",
    kicker: "Plan",
    title: "What is coming up on the calendar?",
    body: "Episodes and releases from both calendars in one answer, with air dates, taken from the demo library.",
    h: 680,
    alt: "Assistarr chat listing upcoming episodes and movie releases from the Sonarr and Radarr calendars",
  },
  {
    key: "approval",
    kicker: "Approve",
    title: "It asks before it changes anything.",
    body: "Deleting a movie stops at an approval card with the exact parameters. Nothing runs until you allow it. In the demo, nothing is ever applied.",
    h: 520,
    alt: "Assistarr approval card for a Delete Radarr Movie tool call with Deny and Allow buttons",
  },
];

function Wall() {
  return (
    <div aria-hidden="true" className="lp-wall">
      {WALL_ROWS.map((row, r) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static decorative rows
        <div className={`lp-wall-row lp-wall-row-${r % 2}`} key={`row-${r}`}>
          {row.map((def, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static decorative tiles
            <div className="lp-tile" key={`${def.title}-${r}-${i}`}>
              <Poster def={def} label={false} uid={`w${r}-${i}`} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function HeroChat() {
  return (
    <figure className="lp-chat">
      <figcaption className="lp-chat-bar">
        <span className="lp-dot" />
        <span>Assistarr</span>
        <span className="lp-chat-bar-note">public demo</span>
      </figcaption>
      <div className="lp-chat-body">
        <p className="lp-msg-user">What&rsquo;s downloading right now?</p>
        <div className="lp-tool">
          <Wrench aria-hidden="true" size={14} />
          <span className="lp-tool-name">Get Radarr Queue</span>
          <span className="lp-tool-meta">1 item</span>
          <span className="lp-tool-done">
            <Check aria-hidden="true" size={12} /> Completed
          </span>
        </div>
        <div className="lp-tool">
          <Wrench aria-hidden="true" size={14} />
          <span className="lp-tool-name">Get Sonarr Queue</span>
          <span className="lp-tool-meta">2 items</span>
          <span className="lp-tool-done">
            <Check aria-hidden="true" size={12} /> Completed
          </span>
        </div>
        <div className="lp-answer">
          <p>Found 2 item(s) in the download queue.</p>
          <ul>
            <li>
              <b>Orbital Kitchen</b>{" "}
              <span>
                S03E06 Reservation for Nine · 75%, 00:04:10 left · HDTV-720p
              </span>
            </li>
            <li>
              <b>Static</b>{" "}
              <span>
                S01E05 Dead Air · 10%, 00:41:00 left · Bluray-1080p · queued
              </span>
            </li>
          </ul>
          <p>Found 1 movie(s) in the download queue.</p>
          <ul>
            <li>
              <b>The General</b> <span>66%, 00:18:42 left · Bluray-1080p</span>
            </li>
          </ul>
        </div>
      </div>
    </figure>
  );
}

export default function LandingPage() {
  return (
    <>
      <header className="lp-header">
        <a className="lp-brand" href="/">
          <Image
            alt=""
            height={26}
            src="/logo.svg"
            width={26}
            className="lp-logo"
          />
          <span>ASSISTARR</span>
        </a>
        <nav aria-label="Primary" className="lp-nav">
          <a href="#shelf">Services</a>
          <a href="#screenings">Screenshots</a>
          <a href="#self-host">Self-host</a>
          <a href={DOCS}>Docs</a>
          <a href={REPO}>GitHub</a>
        </nav>
        <div className="lp-header-end">
          <ThemeToggle />
          <a className="lp-btn lp-btn-small" href={DEMO_HREF} rel="nofollow">
            Try the demo
          </a>
        </div>
        <details className="lp-menu">
          <summary>Menu</summary>
          <div className="lp-menu-panel">
            <a href="#shelf">Services</a>
            <a href="#screenings">Screenshots</a>
            <a href="#self-host">Self-host</a>
            <a href={DOCS}>Docs</a>
            <a href={REPO}>GitHub</a>
          </div>
        </details>
      </header>

      <main>
        <section className="lp-hero">
          <Wall />
          <div className="lp-hero-inner">
            <p className="lp-eyebrow">
              Radarr · Sonarr · Jellyfin · Jellyseerr · qBittorrent
            </p>
            <h1 className="lp-h1">Ask your media server.</h1>
            <p className="lp-lede">
              Assistarr is a chat app for the services you already run. Ask what
              is downloading, look up a title, request it. It shows every tool
              it calls, and it asks before it changes anything.
            </p>
            <div className="lp-cta">
              <a className="lp-btn" href={DEMO_HREF} rel="nofollow">
                Try the demo
              </a>
              <a className="lp-link" href="#self-host">
                Self-host it
              </a>
              <a className="lp-link" href={DOCS}>
                Read the docs <ExternalLink aria-hidden="true" size={14} />
              </a>
            </div>
            <p className="lp-fine">
              A guest session with a made-up library and a scripted assistant.
              No sign-up, nothing is saved, and it uses one cookie to remember
              the session.
            </p>
            <HeroChat />
          </div>
        </section>

        <section className="lp-section" id="shelf">
          <h2 className="lp-h2">
            <span>On the shelf</span>
          </h2>
          <p className="lp-section-lede">
            One chat in front of five services. You connect each with its URL
            and API key; the assistant gets that service&rsquo;s tools.
          </p>
          <ul className="lp-row">
            {SERVICES.map((s) => (
              <li className="lp-service" key={s.name}>
                <div className="lp-service-art">
                  <Poster
                    def={POSTERS[s.poster]}
                    label={false}
                    uid={`s-${s.name}`}
                  />
                  <span className="lp-service-name">{s.name}</span>
                </div>
                <p className="lp-service-role">{s.role}</p>
                <ul className="lp-service-tools">
                  {s.tools.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>

        <section className="lp-section" id="screenings">
          <h2 className="lp-h2">
            <span>From the demo</span>
          </h2>
          <p className="lp-section-lede">
            Screenshots of the live demo at assistarr.vercel.app, taken in both
            themes. The library is made up (public-domain films and invented
            shows), and the assistant is scripted.
          </p>
          <div className="lp-screens">
            {SCREENINGS.map((s) => (
              <figure className="lp-screen" key={s.key}>
                <div className="lp-screen-copy">
                  <p className="lp-kicker">{s.kicker}</p>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
                <div className="lp-frame">
                  {(["light", "dark"] as const).map((t) => (
                    <Image
                      alt={s.alt}
                      className={`lp-shot lp-shot-${t}`}
                      height={s.h}
                      key={t}
                      sizes="(min-width: 1100px) 760px, 100vw"
                      src={`/landing/${s.key}-${t}.webp`}
                      width={1280}
                    />
                  ))}
                </div>
              </figure>
            ))}
          </div>
        </section>

        <section className="lp-section" id="self-host">
          <h2 className="lp-h2">
            <span>Run your own</span>
          </h2>
          <div className="lp-host">
            <div>
              <p className="lp-section-lede lp-flush">
                Assistarr is self-hosted: a Next.js app with Postgres, run from
                a clone of the repository. There is no hosted version and no
                published image yet.
              </p>
              <ul className="lp-needs">
                <li>Docker with Compose v2, or Node.js 24 and PostgreSQL 16</li>
                <li>One AI provider key; OpenRouter works out of the box</li>
                <li>
                  <code>AUTH_SECRET</code> and <code>ENCRYPTION_KEY</code>, 32
                  characters or more each
                </li>
              </ul>
            </div>
            {/* biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard users must be able to scroll the code block */}
            <pre className="lp-code" tabIndex={0}>
              <code>
                <span className="lp-c">$ </span>git clone
                https://github.com/alliecatowo/assistarr.git{"\n"}
                <span className="lp-c">$ </span>cd assistarr{"\n"}
                <span className="lp-c">$ </span>cp .env.example .env{"\n"}
                <span className="lp-c"># </span>
                <span className="lp-c">
                  set POSTGRES_PASSWORD, OPENROUTER_API_KEY,{"\n"}# and
                  AUTH_SECRET + ENCRYPTION_KEY (openssl rand -base64 32){"\n"}
                </span>
                <span className="lp-c">$ </span>docker compose up -d
              </code>
            </pre>
          </div>
        </section>

        <section className="lp-close">
          <h2 className="lp-h2 lp-h2-big">See it with a made-up library.</h2>
          <div className="lp-cta lp-cta-center">
            <a className="lp-btn" href={DEMO_HREF} rel="nofollow">
              Try the demo
            </a>
            <a className="lp-link" href={DOCS}>
              Read the docs <ExternalLink aria-hidden="true" size={14} />
            </a>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <span>Assistarr, Apache-2.0 licensed.</span>
        <a href={REPO}>Source on GitHub</a>
        <a href={`${DOCS}guide/self-hosting`}>Self-hosting guide</a>
        <a href={`${DOCS}reference/tools`}>AI tools reference</a>
      </footer>
    </>
  );
}
