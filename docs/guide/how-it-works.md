# How it works

Assistarr is a Next.js app with a Postgres database. You type a request, a language model decides which tools to call, the tools talk to your services, and the answer streams back with the tool calls shown in the thread.

## One request, end to end

1. You send a message from the chat UI. It posts to `/api/chat` with your session.
2. The route checks your session and daily message limit, loads the chat history, and builds the system prompt (`lib/ai/prompts.ts`).
3. It collects the tools for the services **you** have connected, then calls the model through the Vercel AI SDK (`streamText`).
4. The model answers with text, tool calls, or both. Each tool call runs on the server, against your Radarr, Sonarr, Jellyfin, Jellyseerr or qBittorrent, using the URL and credentials you saved in Settings.
5. Tool results go back to the model, which writes the final answer. The response streams to the browser, and the messages are saved to Postgres.

The UI renders every tool call as a card (name, status, parameters and result) so you can see what the assistant did rather than trust a summary.

## Services are plugins

Each service lives in `lib/plugins/<service>/` and exports a definition: a list of tools, each with a description, an input schema and an `execute` function. The registry in `lib/plugins/registry.ts` registers them, and the plugin manager (`lib/plugins/core/manager.ts`) builds the tool set for a request from your saved service configurations. A service you have not connected contributes no tools.

Adding a service is a new folder plus one registry entry; see [Development](/guide/development#adding-a-service).

## Approvals

A tool whose definition sets `requiresApproval: true` is wrapped so the AI SDK pauses before running it. The chat shows an approval card with the exact parameters and **Deny** / **Allow** buttons. Nothing executes until you allow it, and a prompt-injected tool call cannot skip the step, because the policy is applied when the tool set is built rather than asked of the model.

State-changing tools are flagged this way: adding, editing or deleting movies and series, grabbing releases, removing from queues, requesting media, pausing torrents. Searches, library views, queues and calendars run without a prompt. The [AI tools reference](/reference/tools) marks each one.

## Where your data lives

- **Postgres** holds users, chats, messages, votes, generated documents and your service configurations.
- **Credentials** for your services are encrypted before they are stored, with `ENCRYPTION_KEY`. In production the app refuses to start without a key of 32 or more characters, and there is no plaintext fallback. Changing the key makes saved service configs unreadable.
- **Service URLs** that point at private addresses (localhost, LAN, container names) are rejected unless `ALLOW_PRIVATE_SERVICE_URLS=true`, which the Docker Compose file sets for self-hosting. Link-local and cloud-metadata addresses are always blocked.
- **Redis** is optional and only enables resumable AI streams.

## Sessions

Accounts use NextAuth with a credentials login. The same code path issues short-lived guest sessions, which the [public demo](/guide/demo) uses. Guest creation is rate limited per address.
