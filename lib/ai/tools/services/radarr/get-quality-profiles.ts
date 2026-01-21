import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { RadarrClientError, radarrRequest } from "./client";
import type { RadarrQualityProfile } from "./types";

type GetQualityProfilesProps = {
  session: Session;
};

export const getQualityProfiles = ({ session }: GetQualityProfilesProps) =>
  tool({
    description:
      "Get all quality profiles configured in Radarr. Use this to see available quality options and their IDs before adding or editing movies.",
    inputSchema: z.object({}),
    execute: async () => {
      try {
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
      } catch (error) {
        if (error instanceof RadarrClientError) {
          if (error.statusCode === 401 || error.statusCode === 403) {
            return { error: `Radarr authentication failed: ${error.message}. Please check your API key in settings.` };
          }
          if (error.statusCode === 404) {
            return { error: `Radarr endpoint not found: ${error.message}. Please verify your Radarr URL in settings.` };
          }
          return { error: `Radarr error: ${error.message}` };
        }
        return {
          error: `Failed to get quality profiles: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
        };
      }
    },
  });
