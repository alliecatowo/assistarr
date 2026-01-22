import { DocumentToolResult } from "@/components/artifact/document";
import { DocumentPreview } from "@/components/artifact/document-preview";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/elements/tool";
import type { ChatMessage } from "@/lib/types";

export const MessagePartDocument = ({
  part,
  isReadonly,
}: {
  part: Extract<
    ChatMessage["parts"][number],
    {
      type:
        | "tool-createDocument"
        | "tool-updateDocument"
        | "tool-requestSuggestions";
    }
  >;
  isReadonly: boolean;
}) => {
  const { type, toolCallId } = part;

  if (type === "tool-createDocument") {
    if (part.output && "error" in part.output) {
      return (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-500 dark:bg-red-950/50"
          key={toolCallId}
        >
          Error creating document: {String(part.output.error)}
        </div>
      );
    }
    return (
      <DocumentPreview
        isReadonly={isReadonly}
        key={toolCallId}
        result={part.output}
      />
    );
  }

  if (type === "tool-updateDocument") {
    if (part.output && "error" in part.output) {
      return (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-500 dark:bg-red-950/50"
          key={toolCallId}
        >
          Error updating document: {String(part.output.error)}
        </div>
      );
    }
    return (
      <div className="relative" key={toolCallId}>
        <DocumentPreview
          args={{ ...part.output, isUpdate: true }}
          isReadonly={isReadonly}
          result={part.output}
        />
      </div>
    );
  }

  if (type === "tool-requestSuggestions") {
    const { state } = part;
    return (
      <Tool defaultOpen={true} key={toolCallId}>
        <ToolHeader state={state} type="tool-requestSuggestions" />
        <ToolContent>
          {state === "input-available" && <ToolInput input={part.input} />}
          {state === "output-available" && (
            <ToolOutput
              errorText={undefined}
              output={
                "error" in part.output ? (
                  <div className="rounded border p-2 text-red-500">
                    Error: {String(part.output.error)}
                  </div>
                ) : (
                  <DocumentToolResult
                    isReadonly={isReadonly}
                    result={part.output}
                    type="request-suggestions"
                  />
                )
              }
            />
          )}
        </ToolContent>
      </Tool>
    );
  }

  return null;
};
