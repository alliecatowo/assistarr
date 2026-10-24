import type { Metadata } from "next";
import { DM_Mono, Figtree, Oswald } from "next/font/google";
import "./landing.css";

const display = Oswald({
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600"],
  variable: "--lp-display",
});
const sans = Figtree({
  subsets: ["latin"],
  display: "swap",
  variable: "--lp-sans",
});
const mono = DM_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  variable: "--lp-mono",
});

export const metadata: Metadata = {
  title: "Assistarr: a chat app for your media server",
  description:
    "Ask for movies and shows, check the queue, and manage Radarr, Sonarr, Jellyfin, Jellyseerr and qBittorrent in plain language. Try the public demo with no sign-up.",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`lp ${display.variable} ${sans.variable} ${mono.variable}`}>
      {children}
    </div>
  );
}
