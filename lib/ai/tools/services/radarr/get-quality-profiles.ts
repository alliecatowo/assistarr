import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { withToolErrorHandling } from "../core";
import { radarrRequest } from "./client";
import type { RadarrQualityProfile } from "./types";

type GetQualityProfilesProps = {
  session: Session;
};

export const getQualityProfiles = ({ session }: GetQualityProfilesProps) =>
  tool({
    description:
      "Get all quality profiles configured in Radarr. Use this to see available quality options and their IDs before adding or editing movies.",
    inputSchema: z.object({}),
    execute: withToolErrorHandling(
      { serviceName: "Radarr", operationName: "get quality profiles" },
      async () => {
        const profiles = await radarrRequest<RadarrQualityProfile[]>(
          session.user.id,
          "/qualityprofile"
        );

        return {
          success: true,
          profiles: profiles.map((profile) => ({
            id: profile.id,
            name: profile.name,
            upgradeAllowed: profile.upgradeAllowed,
            cutoff: profile.cutoff,
          })),
        };
      }
    ),
  });
