---
layout: home
hero:
  name: "Assistarr"
  text: "Chat with your media server"
  tagline: Ask for movies and shows, check queues and downloads, and manage Radarr, Sonarr, Jellyfin, Jellyseerr and qBittorrent in plain language.
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: Try the demo
      link: https://assistarr.vercel.app
    - theme: alt
      text: Self-hosting
      link: /guide/self-hosting
features:
  - title: Conversational
    details: A streaming chat interface with tool-execution feedback, built on Next.js and the Vercel AI SDK.
  - title: Your stack
    details: First-class tools for Radarr, Sonarr, Jellyfin, Jellyseerr and qBittorrent, configured per user.
  - title: Asks before it acts
    details: Destructive or state-changing tools, such as adding, deleting or importing, require your approval.
  - title: Self-hosted
    details: Docker Compose with Postgres, optional Redis and Traefik. Service credentials can be encrypted at rest.
---

<div class="landing">

## Try it

[Try the live demo](https://assistarr.vercel.app). It opens straight into the chat as a guest, against a made-up library and a scripted assistant, so no media server or account is needed. Ask what is downloading, what is coming up on the calendar, or to search for a title, and Assistarr calls the same Radarr and Sonarr tools it uses on a real server. The demo is read-only: nothing you do is saved, and settings are locked. To use it with your own services and a real model, install it yourself below.

## Install

Assistarr is self-hosted. There is no published npm package or container image, so you run it from a clone of the repository. You need Docker, plus an AI provider key (the Compose setup uses OpenRouter).

```bash
git clone https://github.com/alliecatowo/assistarr.git
cd assistarr
cp .env.example .env
# set POSTGRES_PASSWORD, AUTH_SECRET and OPENROUTER_API_KEY
docker compose up -d
```

Then open the app, add your services in settings, and start chatting. To run without Docker you need Node.js 20+, pnpm 9+ and PostgreSQL 16+; see [Getting started](/guide/getting-started) and [Self-hosting](/guide/self-hosting).

## What you can ask

- What is in my download queue?
- What new shows are releasing soon?
- What movies do I have?
- Add a movie or series, then approve the request when prompted.

The full list of tools is in the [AI tools reference](/reference/tools).

</div>
