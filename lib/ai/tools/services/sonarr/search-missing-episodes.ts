import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { withToolErrorHandling } from "../core";
import { sonarrRequest } from "./client";
import type { SonarrCommand } from "./types";

type SearchMissingEpisodesProps = {
  session: Session;
};

export const searchMissingEpisodes = ({
  session,
}: SearchMissingEpisodesProps) =>
  tool({
    description:
      "Trigger a search for all missing monitored episodes in Sonarr. This will search indexers for every episode that is monitored but not yet downloaded.",
    inputSchema: z.object({}),
    execute: withToolErrorHandling(
      { serviceName: "Sonarr", operationName: "search missing episodes" },
      async () => {
        const result = await sonarrRequest<SonarrCommand>(
          session.user.id,
          "/command",
          {
            method: "POST",
            body: JSON.stringify({
              name: "MissingEpisodeSearch",
            }),
          }
        );

        return {
          success: true,
          commandId: result.id,
          message: `Search started for all missing episodes. Command ID: ${result.id}`,
        };
      }
    ),
  });
