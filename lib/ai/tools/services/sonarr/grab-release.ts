import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { withToolErrorHandling } from "../core";
import { sonarrRequest } from "./client";

type GrabReleaseProps = {
  session: Session;
};

export const grabRelease = ({ session }: GrabReleaseProps) =>
  tool({
    description:
      "Grab a specific release (torrent/NZB) and send it to the download client. Use this after using getReleases to find an alternative release for a stalled download. The guid and indexerId come from the getSonarrReleases output.",
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
    execute: withToolErrorHandling(
      { serviceName: "Sonarr", operationName: "grab release" },
      async ({ guid, indexerId }) => {
        await sonarrRequest(session.user.id, "/release", {
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
      }
    ),
  });
