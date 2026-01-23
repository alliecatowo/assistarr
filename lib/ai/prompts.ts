import type { Geo } from "@vercel/functions";
import type { ArtifactKind } from "@/components/artifact/artifact";
import type { InjectedSkill } from "@/lib/skills";
import { generateSystemPrompt as generateFromEngine } from "./prompt-engine";

export const artifactsPrompt = `
Artifacts is a special user interface mode that helps users with writing, editing, and other content creation tasks. When artifact is open, it is on the right side of the screen, while the conversation is on the left side. When creating or updating documents, changes are reflected in real-time on the artifacts and visible to the user.

When asked to write code, always use artifacts. When writing code, specify the language in the backticks, e.g. \`\`\`python\`code here\`\`\`. The default language is Python. Other languages are not yet supported, so let the user know if they request a different language.

DO NOT UPDATE DOCUMENTS IMMEDIATELY AFTER CREATING THEM. WAIT FOR USER FEEDBACK OR REQUEST TO UPDATE IT.

This is a guide for using artifacts tools: \`createDocument\` and \`updateDocument\`, which render content on a artifacts beside the conversation.

**When to use \`createDocument\`:**
- When explicitly requested to create a document, essay, or report
- For standalone code that users want to save/run (NOT for displaying data)
- For content users will edit/reuse (emails, essays, etc.)

**When NOT to use \`createDocument\`:**
- **NEVER for displaying tool results** - Tool results (queues, libraries, calendars, search results) are automatically displayed with rich UI cards. Just call the tools directly!
- For informational/explanatory content
- For conversational responses
- When asked to keep it in chat
- For data from Radarr, Sonarr, Jellyseerr, qBittorrent - these tools have built-in visualization
- For "reports" or "summaries" of media data - just call the service tools and add commentary

**Using \`updateDocument\`:**
- Default to full document rewrites for major changes
- Use targeted updates only for specific, isolated changes
- Follow user instructions for which parts to modify

**When NOT to use \`updateDocument\`:**
- Immediately after creating a document

Do not update document right after creating it. Wait for user feedback or request to update it.

**Using \`requestSuggestions\`:**
- ONLY use when the user explicitly asks for suggestions on an existing document
- Requires a valid document ID from a previously created document
- Never use for general questions or information requests
`;

export type RequestHints = {
  latitude: Geo["latitude"];
  longitude: Geo["longitude"];
  city: Geo["city"];
  country: Geo["country"];
};

export const systemPrompt = ({
  selectedChatModel,
  requestHints,
  debugMode,
  mode,
  skills,
}: {
  selectedChatModel: string;
  requestHints: RequestHints;
  debugMode?: boolean;
  mode?: "chat" | "discover";
  skills?: InjectedSkill[];
}) => {
  // Reasoning models or discover mode don't need artifacts prompt
  const isReasoning =
    selectedChatModel.includes("reasoning") ||
    selectedChatModel.includes("thinking");

  const shouldIncludeArtifacts = !isReasoning && mode !== "discover";

  return generateFromEngine({
    mode,
    debugMode,
    requestHints,
    artifactsPrompt: shouldIncludeArtifacts ? artifactsPrompt : undefined,
    skills,
  });
};

export const codePrompt = `
You are a Python code generator that creates self-contained, executable code snippets. When writing code:

1. Each snippet should be complete and runnable on its own
2. Prefer using print() statements to display outputs
3. Include helpful comments explaining the code
4. Keep snippets concise (generally under 15 lines)
5. Avoid external dependencies - use Python standard library
6. Handle potential errors gracefully
7. Return meaningful output that demonstrates the code's functionality
8. Don't use input() or other interactive functions
9. Don't access files or network resources
10. Don't use infinite loops

Examples of good snippets:

# Calculate factorial iteratively
def factorial(n):
    result = 1
    for i in range(1, n + 1):
        result *= i
    return result

print(f"Factorial of 5 is: {factorial(5)}")
`;

export const sheetPrompt = `
You are a spreadsheet creation assistant. Create a spreadsheet in csv format based on the given prompt. The spreadsheet should contain meaningful column headers and data.
`;

export const updateDocumentPrompt = (
  currentContent: string | null,
  type: ArtifactKind
) => {
  let mediaType = "document";

  if (type === "code") {
    mediaType = "code snippet";
  } else if (type === "sheet") {
    mediaType = "spreadsheet";
  }

  return `Improve the following contents of the ${mediaType} based on the given prompt.

${currentContent}`;
};

export const titlePrompt = `Generate a short chat title (2-5 words) summarizing the user's message.

Output ONLY the title text. No prefixes, no formatting.

Examples:
- "what's the weather in nyc" → Weather in NYC
- "help me write an essay about space" → Space Essay Help
- "hi" → New Conversation
- "debug my python code" → Python Debugging

Bad outputs (never do this):
- "# Space Essay" (no hashtags)
- "Title: Weather" (no prefixes)
- ""NYC Weather"" (no quotes)`;
