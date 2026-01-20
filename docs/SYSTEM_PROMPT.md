# Assistarr System Prompt Documentation

This document explains the design and structure of the system prompt used by Assistarr, the home media server assistant.

## File Location

The system prompt is defined in `/lib/ai/prompts.ts` and consists of several components that are combined based on the selected chat model.

## Prompt Architecture

```
systemPrompt = regularPrompt + requestPrompt + artifactsPrompt (if applicable)
```

### Components

| Component | Purpose | Always Included |
|-----------|---------|-----------------|
| `regularPrompt` | Core assistant personality and capabilities | Yes |
| `requestPrompt` | User's geographic context | Yes |
| `artifactsPrompt` | Document/code creation UI guidance | No (excluded for reasoning models) |

## Section Breakdown

### 1. Identity & Introduction

```markdown
You are Assistarr, a friendly and knowledgeable home media server assistant...
```

**Purpose:** Establishes the assistant's name, personality, and primary function. This helps the model understand its role and maintain consistent behavior.

**Design Philosophy:** Keep it brief but clear. The assistant should feel approachable while being competent.

### 2. Capabilities Section

```markdown
## Your Capabilities

You can interact with the following services...
```

**Purpose:** Lists the integrated services (Radarr, Sonarr, Jellyfin, Jellyseerr) so the model knows what tools are available and what each service does.

**Design Philosophy:**
- Use bullet points for scannability
- Include brief descriptions of each service's purpose
- This helps the model route requests to the correct tool

### 3. How to Help Users

```markdown
## How to Help Users

### Searching & Adding Media
...
```

**Purpose:** Provides task-specific guidance organized by common user workflows:
- Searching & Adding Media
- Monitoring Downloads
- Calendar & Upcoming Releases
- Library Management
- Media Requests

**Design Philosophy:**
- Group related tasks together
- Give specific, actionable instructions
- Anticipate common user needs

### 4. Response Guidelines

```markdown
## Response Guidelines

1. **Be proactive** - Use tools immediately...
```

**Purpose:** Defines how the assistant should behave and format its responses:
- Proactivity (don't ask, just do)
- Conciseness
- Formatting (markdown tables for lists)
- Error handling
- Confirmation before actions

**Design Philosophy:**
- Number important guidelines for emphasis
- Include concrete examples (the markdown table)
- Balance helpfulness with safety (confirm before modifying)

### 5. Example Interactions

```markdown
## Example Interactions

- "Add the new Dune movie" → Search Radarr, confirm the right one, add it
```

**Purpose:** Shows the model how to handle common requests with specific action flows.

**Design Philosophy:**
- Use real-world examples
- Show the expected action chain, not just the input/output
- Cover the main use cases

### 6. Fallback Behavior

```markdown
When asked to write, create, or help with something unrelated to media management...
```

**Purpose:** Ensures the assistant can still help with general tasks while maintaining its primary focus.

## Extending the Prompt

### Adding a New Service

1. Add the service to the **Capabilities** section:
   ```markdown
   - **ServiceName** - Brief description of what it does
   ```

2. Add a workflow section under **How to Help Users**:
   ```markdown
   ### Service Category
   - Specific task guidance
   - Another task
   ```

3. Add an example interaction:
   ```markdown
   - "User request" → Tool to use, expected action
   ```

### Adding New Capabilities to Existing Services

1. Update the relevant workflow section with the new capability
2. Add an example if the workflow is non-obvious
3. Consider if response guidelines need updates

### Example: Adding Plex Support

```typescript
// In the Capabilities section, add:
- **Plex** - Alternative media server (browse library, manage users)

// In How to Help Users, add:
### Plex Management
- Browse and search the Plex library
- Check currently playing streams
- Manage user access and sharing

// In Example Interactions, add:
- "Who's watching on Plex?" → Check Plex active streams
- "Add my friend to Plex" → Create Plex user invite
```

## Best Practices

### Do

- Keep instructions specific and actionable
- Use markdown formatting for structure
- Include examples for complex workflows
- Update examples when adding features
- Test prompts with real user queries

### Don't

- Make the prompt too long (models have context limits)
- Include implementation details (keep it behavioral)
- Assume the model knows service-specific terminology without explanation
- Forget to update examples when capabilities change

## Testing Changes

After modifying the prompt:

1. Test common queries ("add a movie", "what's downloading")
2. Test edge cases (unknown movie, service unavailable)
3. Verify formatting (tables render correctly)
4. Check that the assistant maintains its personality
5. Ensure proactive behavior works as expected

## Related Files

- `/lib/ai/prompts.ts` - Prompt definitions
- `/lib/ai/tools/` - Tool implementations that the prompt references
- `/components/artifact.tsx` - Artifact UI component (related to `artifactsPrompt`)
