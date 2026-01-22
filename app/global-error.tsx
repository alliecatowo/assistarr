"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // biome-ignore lint/suspicious/noConsole: Log error for debugging
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            fontFamily: "system-ui, sans-serif",
            backgroundColor: "#fafafa",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "28rem",
              borderRadius: "0.5rem",
              border: "1px solid #e5e5e5",
              backgroundColor: "#ffffff",
              padding: "1.5rem",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                color: "#dc2626",
                marginBottom: "0.5rem",
              }}
            >
              Critical Error
            </h1>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#737373",
                marginBottom: "1rem",
              }}
            >
              A critical error occurred in the application. Please try again.
            </p>
            {process.env.NODE_ENV === "development" && (
              <div
                style={{
                  backgroundColor: "#f5f5f5",
                  borderRadius: "0.375rem",
                  padding: "0.75rem",
                  marginBottom: "1rem",
                }}
              >
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "0.875rem",
                    color: "#525252",
                    wordBreak: "break-all",
                  }}
                >
                  {error.message}
                </p>
                {error.digest && (
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "#a3a3a3",
                      marginTop: "0.5rem",
                    }}
                  >
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={reset}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#ffffff",
                  backgroundColor: "#171717",
                  border: "none",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                }}
                type="button"
              >
                Try again
              </button>
              <button
                onClick={() => {
                  window.location.href = "/";
                }}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#171717",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e5e5",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                }}
                type="button"
              >
                Go home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
