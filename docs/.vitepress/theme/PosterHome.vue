<script setup lang="ts">
import { withBase } from "vitepress";

const poster = (n: number) => withBase(`/posters/${String(n % 20).padStart(2, "0")}.svg`);
const rows = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
  [5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
];

const shelf = [
  { t: "Getting started", d: "Run it from source in a few commands.", href: "/guide/getting-started", p: 2 },
  { t: "Self-hosting", d: "Docker Compose, Redis, Traefik, updating.", href: "/guide/self-hosting", p: 3 },
  { t: "Configuration", d: "Every environment variable that matters.", href: "/guide/configuration", p: 11 },
  { t: "Services", d: "Connect Radarr, Sonarr, Jellyfin and the rest.", href: "/guide/services", p: 1 },
  { t: "How it works", d: "Chat, tools, approvals and the plugin system.", href: "/guide/how-it-works", p: 5 },
  { t: "The demo", d: "What the public demo is, and is not.", href: "/guide/demo", p: 8 },
  { t: "AI tools", d: "What the assistant can call, per service.", href: "/reference/tools", p: 16 },
  { t: "Development", d: "Commands, layout, adding a service.", href: "/guide/development", p: 13 },
];
</script>

<template>
  <div class="ph">
    <section class="ph-hero">
      <div class="ph-wall" aria-hidden="true">
        <div v-for="(row, r) in rows" :key="r" class="ph-row" :class="`ph-row-${r % 2}`">
          <img v-for="n in row" :key="n" :src="poster(n)" alt="" width="200" height="300" loading="eager" />
        </div>
      </div>
      <div class="ph-inner">
        <p class="ph-eyebrow">Documentation</p>
        <h1 class="ph-h1">Assistarr</h1>
        <p class="ph-tag">
          A chat app for Radarr, Sonarr, Jellyfin, Jellyseerr and qBittorrent.
          Ask in plain language; it shows each tool call and asks before it
          changes anything.
        </p>
        <div class="ph-cta">
          <a class="ph-btn" href="https://assistarr.vercel.app" rel="nofollow">Try the demo</a>
          <a class="ph-link" :href="withBase('/guide/getting-started')">Get started</a>
          <a class="ph-link" :href="withBase('/guide/self-hosting')">Self-host with Docker</a>
        </div>
      </div>
    </section>

    <section class="ph-section">
      <h2 class="ph-h2"><span>The library</span></h2>
      <ul class="ph-shelf">
        <li v-for="s in shelf" :key="s.href">
          <a :href="withBase(s.href)" class="ph-card">
            <span class="ph-art">
              <img :src="poster(s.p)" alt="" width="200" height="300" loading="lazy" />
              <span class="ph-art-title">{{ s.t }}</span>
            </span>
            <span class="ph-desc">{{ s.d }}</span>
          </a>
        </li>
      </ul>
    </section>

    <section class="ph-section">
      <h2 class="ph-h2"><span>What it looks like</span></h2>
      <p class="ph-lede">
        A screenshot of the live demo, which uses a made-up library and a
        scripted assistant. Your own install talks to your services and a real
        model.
      </p>
      <div class="ph-frame">
        <img class="ph-shot-light" :src="withBase('/screens/chat-light.webp')" alt="Assistarr chat answering a download-queue question with Radarr and Sonarr tool calls" width="1280" height="600" loading="lazy" />
        <img class="ph-shot-dark" :src="withBase('/screens/chat-dark.webp')" alt="Assistarr chat answering a download-queue question with Radarr and Sonarr tool calls" width="1280" height="600" loading="lazy" />
      </div>
    </section>

    <section class="ph-section ph-install">
      <h2 class="ph-h2"><span>Install</span></h2>
      <p class="ph-lede">
        Assistarr is self-hosted and run from a clone of the repository; there
        is no published package or image. You need Docker, an AI provider key,
        and two generated secrets (<code>AUTH_SECRET</code> and
        <code>ENCRYPTION_KEY</code>, 32 characters or more each).
      </p>
      <pre class="ph-code"><code><span class="c">$ </span>git clone https://github.com/alliecatowo/assistarr.git
<span class="c">$ </span>cd assistarr
<span class="c">$ </span>cp .env.example .env
<span class="c"># set POSTGRES_PASSWORD, OPENROUTER_API_KEY,
# AUTH_SECRET and ENCRYPTION_KEY (openssl rand -base64 32)</span>
<span class="c">$ </span>docker compose up -d</code></pre>
    </section>
  </div>
</template>
