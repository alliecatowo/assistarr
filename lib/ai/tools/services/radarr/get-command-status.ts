import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { RadarrClientError, radarrRequest } from "./client";
import type { RadarrCommand } from "./types";

type GetCommandStatusProps = {
  session: Session;
};

export const getCommandStatus = ({ session }: GetCommandStatusProps) =>
  tool({
    description:
      "Check the status of a Radarr command. Use this after executing commands like manual import or scan to verify completion. Commands can be queued, started, completed, failed, or aborted.",
    inputSchema: z.object({
      commandId: z.number().describe("The command ID to check status for"),
    }),
    execute: async ({ commandId }) => {
      try {
        const command = await radarrRequest<RadarrCommand>(
          session.user.id,
          `/command/${commandId}`
        );

        const result = {
          id: command.id,
          name: command.name,
          commandName: command.commandName,
          status: command.status,
          result: command.result,
          message: command.message,
          queued: command.queued,
          started: command.started,
          ended: command.ended,
          stateChangeTime: command.stateChangeTime,
        };

        // Provide human-readable status message
        let statusMessage: string;
        switch (command.status) {
          case "completed":
            statusMessage = `Command completed successfully${command.ended ? ` at ${command.ended}` : ""}.`;
            break;
          case "failed":
            statusMessage = `Command failed${command.message ? `: ${command.message}` : "."}`;
            break;
          case "started":
            statusMessage = `Command is currently running${command.started ? ` (started at ${command.started})` : ""}.`;
            break;
          case "queued":
            statusMessage = "Command is queued and waiting to run.";
            break;
          case "aborted":
            statusMessage = "Command was aborted.";
            break;
          default:
            statusMessage = `Command status: ${command.status}`;
        }

        return {
          ...result,
          statusMessage,
          isComplete: command.status === "completed",
          isFailed: command.status === "failed",
          isRunning: command.status === "started",
          isPending: command.status === "queued",
        };
      } catch (error) {
        if (error instanceof RadarrClientError) {
          return { error: error.message };
        }
        return { error: "Failed to get command status. Please try again." };
      }
    },
  });
