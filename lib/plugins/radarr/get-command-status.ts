import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { RadarrClient } from "./client";
import type { RadarrCommand } from "./types";

export const getCommandStatus = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new RadarrClient(config);

  return tool({
    description:
      "Check the status of a Radarr command. Use this after executing commands like manual import or scan to verify completion. Commands can be queued, started, completed, failed, or aborted.",
    inputSchema: z.object({
      commandId: z.number().describe("The command ID to check status for"),
    }),
    execute: async ({ commandId }) => {
      try {
        const command = await client.get<RadarrCommand>(
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

        return {
          ...result,
          statusMessage: getStatusMessage(command),
          isComplete: command.status === "completed",
          isFailed: command.status === "failed",
          isRunning: command.status === "started",
          isPending: command.status === "queued",
        };
      } catch (error) {
        return {
          id: commandId,
          status: "unknown",
          message: `Error checking command status: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
};

function getStatusMessage(command: RadarrCommand): string {
  switch (command.status) {
    case "completed":
      return `Command completed successfully${command.ended ? ` at ${command.ended}` : ""}.`;
    case "failed":
      return `Command failed${command.message ? `: ${command.message}` : "."}`;
    case "started":
      return `Command is currently running${command.started ? ` (started at ${command.started})` : ""}.`;
    case "queued":
      return "Command is queued and waiting to run.";
    case "aborted":
      return "Command was aborted.";
    default:
      return `Command status: ${command.status}`;
  }
}
