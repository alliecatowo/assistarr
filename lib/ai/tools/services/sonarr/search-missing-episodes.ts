import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { SonarrClientError, sonarrRequest } from "./client";
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
    execute: async () => {
      try {
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
      } catch (error) {
        if (error instanceof SonarrClientError) {
          return { error: error.message };
        }
        return {
          error: "Failed to start missing episode search. Please try again.",
        };
      }
    },
  });
