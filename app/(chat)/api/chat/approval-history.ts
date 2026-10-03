import type { DBMessage } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";
import { convertToUIMessages } from "@/lib/utils";
import { type UserMessage, userMessageSchema } from "./schema";

type AnyPart = Record<string, unknown>;

type ApprovalResponse = { approved: boolean; reason?: string };

export type ApprovalHistory = {
  /** Server-trusted history: DB messages with approval responses applied. */
  uiMessages: ChatMessage[];
  /** A brand new user turn that rode along with the approval responses. */
  newUserMessage: UserMessage | undefined;
  /** Number of pending tool approvals the client answered. */
  appliedApprovals: number;
};

function isToolPart(part: AnyPart): boolean {
  return (
    typeof part.type === "string" &&
    (part.type.startsWith("tool-") || part.type === "dynamic-tool") &&
    typeof part.toolCallId === "string"
  );
}

type ClaimedResponse = ApprovalResponse & { approvalId?: string };

function readClaim(raw: unknown): [string, ClaimedResponse] | null {
  const part = raw as AnyPart;
  if (!part || typeof part !== "object" || !isToolPart(part)) {
    return null;
  }
  if (part.state !== "approval-responded" && part.state !== "output-denied") {
    return null;
  }
  const approval = part.approval as
    | { id?: unknown; approved?: unknown; reason?: unknown }
    | undefined;
  if (typeof approval?.approved !== "boolean") {
    return null;
  }
  return [
    part.toolCallId as string,
    {
      approved: approval.approved,
      approvalId: typeof approval.id === "string" ? approval.id : undefined,
      reason:
        typeof approval.reason === "string"
          ? approval.reason.slice(0, 500)
          : undefined,
    },
  ];
}

/** Approval responses the client claims, keyed by toolCallId. */
function collectClientResponses(
  clientMessages: Array<{ id: string; parts: unknown[] }>,
  knownIds: Set<string>
): Map<string, ClaimedResponse> {
  const responses = new Map<string, ClaimedResponse>();
  for (const msg of clientMessages) {
    if (!knownIds.has(msg.id)) {
      continue;
    }
    for (const raw of msg.parts) {
      const claim = readClaim(raw);
      if (claim) {
        responses.set(claim[0], claim[1]);
      }
    }
  }
  return responses;
}

/**
 * Builds the history for a tool-approval request from the database, never from
 * the client. The client may only (a) answer approval requests that the server
 * itself stored as "approval-requested" and (b) append one new, validated user
 * message. Everything else it sends is ignored, so it cannot forge assistant
 * output, tool results or other users' messages.
 */
export function buildApprovalHistory(
  dbMessages: DBMessage[],
  clientMessages: Array<{ id: string; role: string; parts: unknown[] }>
): ApprovalHistory {
  if (dbMessages.length === 0) {
    throw new ChatSDKError("bad_request:api");
  }

  const dbIds = new Set(dbMessages.map((m) => m.id));
  const responses = collectClientResponses(clientMessages, dbIds);

  let appliedApprovals = 0;
  const uiMessages = convertToUIMessages(dbMessages).map((msg) => {
    if (msg.role !== "assistant") {
      return msg;
    }
    const parts = (msg.parts as unknown as AnyPart[]).map((part) => {
      if (!isToolPart(part) || part.state !== "approval-requested") {
        return part;
      }
      const response = responses.get(part.toolCallId as string);
      const stored = part.approval as { id?: string } | undefined;
      if (!(response && stored?.id)) {
        return part;
      }
      if (response.approvalId && response.approvalId !== stored.id) {
        return part;
      }
      appliedApprovals++;
      return {
        ...part,
        state: "approval-responded",
        approval: {
          id: stored.id,
          approved: response.approved,
          ...(response.reason ? { reason: response.reason } : {}),
        },
      };
    });
    return { ...msg, parts } as unknown as ChatMessage;
  });

  let newUserMessage: UserMessage | undefined;
  const last = clientMessages.at(-1);
  if (last && last.role === "user" && !dbIds.has(last.id)) {
    const parsed = userMessageSchema.safeParse(last);
    if (!parsed.success) {
      throw new ChatSDKError("bad_request:api");
    }
    newUserMessage = parsed.data;
    uiMessages.push({
      id: newUserMessage.id,
      role: "user",
      parts: newUserMessage.parts,
    } as ChatMessage);
  }

  if (appliedApprovals === 0 && !newUserMessage) {
    throw new ChatSDKError("bad_request:api");
  }

  return { uiMessages, newUserMessage, appliedApprovals };
}
