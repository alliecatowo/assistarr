import { smoothStream, streamText } from "ai";
import { updateDocumentPrompt } from "@/lib/ai/prompts";
import { getArtifactModel } from "@/lib/ai/providers";
import { createDocumentHandler } from "@/lib/artifacts/server";

export const textDocumentHandler = createDocumentHandler<"text">({
  kind: "text",
  onCreateDocument: async ({ title, dataStream, initialContent }) => {
    let draftContent = "";

    try {
      const { fullStream } = streamText({
        model: getArtifactModel(),
        system:
          "Write about the given topic. Markdown is supported. Use headings wherever appropriate. If context is provided, use it to populate the document.",
        experimental_transform: smoothStream({ chunking: "word" }),
        prompt: initialContent
          ? `Title: ${title}\n\nContext/Content:\n${initialContent}\n\nPlease generate the document content based on the title and provided context.`
          : title,
      });

      for await (const delta of fullStream) {
        const { type } = delta;

        if (type === "text-delta") {
          const { text } = delta;

          draftContent += text;

          dataStream.write({
            type: "data-textDelta",
            data: text,
            transient: true,
          });
        } else if (type === "error") {
          console.error("[textDocumentHandler] Stream error:", delta);
        }
      }

      if (!draftContent) {
        console.error(
          "[textDocumentHandler] No content generated for document:",
          title
        );
      }
    } catch (error) {
      console.error("[textDocumentHandler] Error generating document:", error);
      // Write error message to stream so user sees something
      const errorMessage = `Error generating document: ${error instanceof Error ? error.message : "Unknown error"}`;
      dataStream.write({
        type: "data-textDelta",
        data: errorMessage,
        transient: true,
      });
      draftContent = errorMessage;
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = "";

    try {
      const { fullStream } = streamText({
        model: getArtifactModel(),
        system: updateDocumentPrompt(document.content, "text"),
        experimental_transform: smoothStream({ chunking: "word" }),
        prompt: description,
        providerOptions: {
          openai: {
            prediction: {
              type: "content",
              content: document.content,
            },
          },
        },
      });

      for await (const delta of fullStream) {
        const { type } = delta;

        if (type === "text-delta") {
          const { text } = delta;

          draftContent += text;

          dataStream.write({
            type: "data-textDelta",
            data: text,
            transient: true,
          });
        } else if (type === "error") {
          console.error("[textDocumentHandler] Update stream error:", delta);
        }
      }

      if (!draftContent) {
        console.error(
          "[textDocumentHandler] No content generated for document update:",
          document.id
        );
      }
    } catch (error) {
      console.error(
        "[textDocumentHandler] Error updating document:",
        error
      );
      const errorMessage = `Error updating document: ${error instanceof Error ? error.message : "Unknown error"}`;
      dataStream.write({
        type: "data-textDelta",
        data: errorMessage,
        transient: true,
      });
      draftContent = errorMessage;
    }

    return draftContent;
  },
});
