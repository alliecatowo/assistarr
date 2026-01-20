import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { SonarrClientError, sonarrRequest } from "./client";

// Using the same type structure as Radarr for ease, but Sonarr has specific fields too.
// Assuming basic structure matches for QualityProfile.
interface SonarrQualityProfile {
  id: number;
  name: string;
  upgradeAllowed: boolean;
  cutoff: number;
}

type GetQualityProfilesProps = {
  session: Session;
};

export const getQualityProfiles = ({ session }: GetQualityProfilesProps) =>
  tool({
    description:
      "Get all quality profiles configured in Sonarr. Use this to see available quality options and their IDs before adding or editing series.",
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const profiles = await sonarrRequest<SonarrQualityProfile[]>(
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
        if (error instanceof SonarrClientError) {
          return { error: error.message };
        }
        return { error: "Failed to get quality profiles. Please try again." };
      }
    },
  });
