import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { RadarrClient } from "./client";
import type { RadarrQualityProfile } from "./types";

export const getQualityProfiles = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new RadarrClient(config);

  return tool({
    description:
      "Get all quality profiles configured in Radarr. Use this to see available quality options and their IDs before adding or editing movies.",
    inputSchema: z.object({}),
    execute: async () => {
      const profiles =
        await client.get<RadarrQualityProfile[]>("/qualityprofile");

      return {
        success: true,
        profiles: profiles.map((profile) => ({
          id: profile.id,
          name: profile.name,
          upgradeAllowed: profile.upgradeAllowed,
          cutoff: profile.cutoff,
        })),
      };
    },
  });
};
