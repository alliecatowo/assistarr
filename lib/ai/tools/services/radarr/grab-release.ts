import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { RadarrClientError, radarrRequest } from "./client";

type GrabReleaseProps = {
  session: Session;
};

export const grabRelease = ({ session }: GrabReleaseProps) =>
  tool({
    description:
      "Grab a specific release (torrent/NZB) and send it to the download client. Use this after using getReleases to find an alternative release for a stalled download. The guid and indexerId come from the getReleases output.",
    inputSchema: z.object({
      guid: z
        .string()
        .describe(
          "The unique identifier of the release to grab (from getReleases)"
        ),
      indexerId: z
        .number()
        .describe("The indexer ID for the release (from getReleases)"),
    }),
    execute: async ({ guid, indexerId }) => {
      try {
        await radarrRequest(session.user.id, "/release", {
          method: "POST",
          body: JSON.stringify({
            guid,
            indexerId,
          }),
        });

        return {
          success: true,
          message:
            "Release grabbed successfully. It should appear in the download queue shortly.",
        };
      } catch (error) {
        if (error instanceof RadarrClientError) {
          if (error.statusCode === 404) {
            return { error: `Release not found. The indexer may no longer have this release available.` };
          }
          if (error.statusCode === 400) {
            return { error: `Failed to grab release: ${error.message}. The release may be invalid or already grabbed.` };
          }
          if (error.statusCode === 401 || error.statusCode === 403) {
            return { error: `Radarr authentication failed: ${error.message}. Please check your API key.` };
          }
          return { error: `Radarr error: ${error.message}` };
        }
        return {
          error: `Failed to grab release: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
        };
      }
    },
  });
