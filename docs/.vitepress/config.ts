import { defineConfig } from "vitepress";

// GitHub Pages serves project sites under /<repo>/. Set DOCS_BASE=/ for a custom domain.
export default defineConfig({
  title: "Assistarr",
  description:
    "A chat assistant for your self-hosted media stack: Radarr, Sonarr, Jellyfin, Jellyseerr and qBittorrent.",
  base: process.env.DOCS_BASE ?? "/assistarr/",
  cleanUrls: true,
  lastUpdated: true,
  // The repo root has a Tailwind PostCSS config that the docs site must not pick up.
  vite: { css: { postcss: { plugins: [] } } },
  // Internal engineering notes and older drafts that live in docs/ but are not part of the site.
  srcExclude: [
    "ARCHITECTURE.md",
    "DATABASE.md",
    "MCP_RESEARCH.md",
    "PLUGIN_ARCHITECTURE.md",
    "SELF_HOSTING.md",
    "SESSION_STATUS.md",
    "SETUP.md",
    "SYSTEM_PROMPT.md",
    "TESTING.md",
    "TOOLS.md",
    "apis/**",
    "plans/**",
    "archive/**",
  ],
  head: [
    [
      "link",
      { rel: "icon", href: "/assistarr/logo.svg", type: "image/svg+xml" },
    ],
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    [
      "link",
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
    ],
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&family=Oswald:wght@500;600&display=swap",
      },
    ],
  ],
  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "How it works", link: "/guide/how-it-works" },
      { text: "Tools", link: "/reference/tools" },
      { text: "Demo", link: "https://assistarr.vercel.app" },
    ],
    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Getting started", link: "/guide/getting-started" },
          { text: "Self-hosting with Docker", link: "/guide/self-hosting" },
          { text: "Configuration", link: "/guide/configuration" },
          { text: "Connecting your services", link: "/guide/services" },
          { text: "The public demo", link: "/guide/demo" },
        ],
      },
      {
        text: "Internals",
        items: [
          { text: "How it works", link: "/guide/how-it-works" },
          { text: "Development", link: "/guide/development" },
        ],
      },
      {
        text: "Reference",
        items: [{ text: "AI tools", link: "/reference/tools" }],
      },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/alliecatowo/assistarr" },
    ],
    search: { provider: "local" },
  },
});
