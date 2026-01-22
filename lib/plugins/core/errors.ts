/**
 * Custom error class for plugin tool errors.
 *
 * Throwing ToolError from tools allows the AI SDK to catch and
 * present errors appropriately to users, rather than hiding them
 * in return values.
 */
export class ToolError extends Error {
  public readonly toolName: string;
  public readonly cause?: Error;

  constructor(message: string, toolName: string, cause?: Error) {
    super(message);
    this.name = "ToolError";
    this.toolName = toolName;
    this.cause = cause;

    // Maintains proper stack trace in V8 environments (Node.js, Chrome)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ToolError);
    }
  }

  /**
   * Creates a ToolError from an unknown caught value.
   * Useful in catch blocks where the error type is unknown.
   */
  static fromUnknown(
    error: unknown,
    toolName: string,
    fallbackMessage = "Unknown error"
  ): ToolError {
    if (error instanceof ToolError) {
      return error;
    }
    if (error instanceof Error) {
      return new ToolError(error.message, toolName, error);
    }
    return new ToolError(
      typeof error === "string" ? error : fallbackMessage,
      toolName
    );
  }
}
