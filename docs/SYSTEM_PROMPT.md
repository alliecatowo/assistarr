# Assistarr System Prompt Documentation

This document explains the design and structure of the **Dynamic Prompt Engine** used by Assistarr.

## Overview

Assistarr uses a dynamic prompt generation system instead of static text files. The system prompt is constructed at runtime using LiquidJS templates, injecting available plugins, tools, and user context automatically.

## Architecture

The prompt generation consists of three main parts:

1.  **Engine** (`lib/ai/prompt-engine.ts`): Orchestrates data gathering and template rendering.
2.  **Templates** (`lib/ai/templates/*.liquid`): LiquidJS files defining the structure and static instructions.
3.  **Plugins** (`lib/plugins/`): Self-contained modules that provide tools and capabilities.

## How It Works

When a chat session starts, `generateSystemPrompt()` is called:

1.  **Select Template:** Based on the mode (chat, discover, debug), the engine selects the appropriate template from `lib/ai/templates/`.
2.  **Gather Context:**
    *   **Plugins:** The engine queries the `pluginManager` for all registered plugins and their tools.
    *   **Request Hints:** User location and time context.
    *   **Artifacts:** Instructions for UI generation (if applicable).
3.  **Render:** The template is compiled with this data to produce the final system prompt sent to the LLM.

## Templates

Templates live in `lib/ai/templates/`. Common templates include:

*   `system.liquid`: The standard chat assistant prompt.
*   `discover.liquid`: specialized prompt for media discovery.
*   `debug.liquid`: Minimal prompt for debugging purposes.

Templates use standard Liquid syntax to iterate over plugins and tools:

```liquid
{% for plugin in plugins %}
## {{ plugin.displayName }}
{% for tool in plugin.tools %}
- **{{ tool.name }}**: {{ tool.description }}
{% endfor %}
{% endfor %}
```

## Developer Workflow

### Adding a New Tool

You **do not** need to manually edit the system prompt when adding new capabilities.

1.  **Create Tool:** Write your tool code in `lib/plugins/<plugin>/tools/`.
2.  **Register:** Ensure your plugin and tool are registered with the `pluginManager`.
3.  **Done:** The Dynamic Prompt Engine automatically detects the new tool and injects its description into the system prompt on the next request.

### Modifying Core Behavior

To change the assistant's personality, rules, or core instructions (non-tool related):

1.  Edit `lib/ai/templates/system.liquid`.
2.  Changes take effect immediately (templates are cached in memory, so a server restart may be required in production, but hot-reloading usually handles it in dev).

## Related Files

*   `lib/ai/prompt-engine.ts`: Main logic for prompt generation.
*   `lib/ai/templates/`: Directory containing LiquidJS prompt templates.
*   `lib/plugins/`: Directory where tools and capabilities are defined.
