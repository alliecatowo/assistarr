import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { withToolErrorHandling } from "../core";
import { sonarrRequest } from "./client";

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
    execute: withToolErrorHandling(
      { serviceName: "Sonarr", operationName: "get quality profiles" },
      async () => {
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
      }
    ),
  });
