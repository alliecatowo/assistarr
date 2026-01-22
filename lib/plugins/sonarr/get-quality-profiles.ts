import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { SonarrClient } from "./client";
import type { SonarrQualityProfile } from "./types";

export const getQualityProfiles = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new SonarrClient(config);

  return tool({
    description:
      "Get all quality profiles configured in Sonarr. Use this to see available quality options and their IDs before adding or editing series.",
    inputSchema: z.object({}),
    execute: async () => {
      const profiles =
        await client.get<SonarrQualityProfile[]>("/qualityprofile");

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
