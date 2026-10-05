# The public demo

[assistarr.vercel.app](https://assistarr.vercel.app) is a public demo of the app, set up so anyone can try it without a media server, an account or an API key.

## What you get

Open it and the landing page offers **Try the demo**. That starts a guest session and opens the app. Behind it:

- a **made-up library**: public-domain films and invented shows, answered from fixtures inside the app, so no real service is contacted;
- a **scripted assistant** instead of a language model. It matches keywords and then makes real tool calls, so the tool cards, results and approval prompts are the same ones a real install shows.

Things it understands: what is downloading, what is on the calendar, show the movie or TV library, search for a title, list quality profiles, and "delete a movie" (which stops at the approval card).

## What it will not do

The demo is read-only. Saving settings, uploading files, registering and logging in are disabled, nothing you do is stored against a real server, and the delete in the approval card is never applied. Guest sessions are limited per address, so a burst of new visitors from one network may be asked to wait.

The demo needs cookies: the guest session is kept in one. If your browser blocks them, you will see a "Cookies required" page instead of the app.

## Running your own demo

Set `DEMO_MODE=true`. With no AI provider key it uses the scripted assistant; with `OPENROUTER_API_KEY` or `AI_GATEWAY_API_KEY` set it uses a real model against the fixture library. Do this only on a deployment meant to be public: it turns on the guest-only, read-only behaviour above and shows the landing page to signed-out visitors.
