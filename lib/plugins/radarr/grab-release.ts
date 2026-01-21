import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { RadarrClient } from "./client";

export const grabRelease = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new RadarrClient(config);

  return tool({
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
        await client.post("/api/v3/release", {
          guid,
          indexerId,
        });

        return {
          success: true,
          message:
            "Release grabbed successfully. It should appear in the download queue shortly.",
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to grab release: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
};
