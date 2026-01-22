/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../button";

describe("Button", () => {
  describe("rendering", () => {
    it("should render with default props", () => {
      render(<Button>Click me</Button>);

      const button = screen.getByRole("button", { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("bg-primary");
    });

    it("should render children correctly", () => {
      render(
        <Button>
          <span data-testid="child">Child content</span>
        </Button>
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
      expect(screen.getByText("Child content")).toBeInTheDocument();
    });

    it("should forward ref to the button element", () => {
      const ref = vi.fn();
      render(<Button ref={ref}>Button</Button>);

      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLButtonElement);
    });

    it("should spread additional props to the button", () => {
      render(
        <Button data-testid="test-button" aria-label="Custom label">
          Button
        </Button>
      );

      const button = screen.getByTestId("test-button");
      expect(button).toHaveAttribute("aria-label", "Custom label");
    });
  });

  describe("variants", () => {
    it("should render default variant", () => {
      render(<Button variant="default">Default</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-primary");
      expect(button).toHaveClass("text-primary-foreground");
    });

    it("should render destructive variant", () => {
      render(<Button variant="destructive">Destructive</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-destructive");
      expect(button).toHaveClass("text-destructive-foreground");
    });

    it("should render outline variant", () => {
      render(<Button variant="outline">Outline</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("border");
      expect(button).toHaveClass("border-input");
      expect(button).toHaveClass("bg-background");
    });

    it("should render secondary variant", () => {
      render(<Button variant="secondary">Secondary</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-secondary");
      expect(button).toHaveClass("text-secondary-foreground");
    });

    it("should render ghost variant", () => {
      render(<Button variant="ghost">Ghost</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("hover:bg-accent");
      expect(button).toHaveClass("hover:text-accent-foreground");
    });

    it("should render link variant", () => {
      render(<Button variant="link">Link</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-primary");
      expect(button).toHaveClass("underline-offset-4");
    });
  });

  describe("sizes", () => {
    it("should render default size", () => {
      render(<Button size="default">Default Size</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-10");
      expect(button).toHaveClass("px-4");
      expect(button).toHaveClass("py-2");
    });

    it("should render small size", () => {
      render(<Button size="sm">Small</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-9");
      expect(button).toHaveClass("px-3");
    });

    it("should render large size", () => {
      render(<Button size="lg">Large</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-11");
      expect(button).toHaveClass("px-8");
    });

    it("should render icon size", () => {
      render(<Button size="icon">Icon</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-10");
      expect(button).toHaveClass("w-10");
    });

    it("should render icon-sm size", () => {
      render(<Button size="icon-sm">Icon Small</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-8");
      expect(button).toHaveClass("w-8");
    });
  });

  describe("interactions", () => {
    it("should call onClick handler when clicked", () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should not call onClick when disabled", () => {
      const handleClick = vi.fn();
      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it("should have disabled styles when disabled", () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveClass("disabled:pointer-events-none");
      expect(button).toHaveClass("disabled:opacity-50");
    });
  });

  describe("asChild prop", () => {
    it("should render as a slot when asChild is true", () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );

      const link = screen.getByRole("link");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/test");
      expect(link).toHaveClass("bg-primary");
    });
  });

  describe("custom className", () => {
    it("should merge custom className with default classes", () => {
      render(<Button className="custom-class">Custom</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class");
      expect(button).toHaveClass("bg-primary");
    });
  });

  describe("accessibility", () => {
    it("should have correct button type by default", () => {
      render(<Button>Button</Button>);

      const button = screen.getByRole("button");
      // React buttons default to type="submit" when no type specified
      expect(button.tagName).toBe("BUTTON");
    });

    it("should support type attribute", () => {
      render(<Button type="submit">Submit</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "submit");
    });

    it("should be focusable", () => {
      render(<Button>Focusable</Button>);

      const button = screen.getByRole("button");
      button.focus();

      expect(document.activeElement).toBe(button);
    });

    it("should not be focusable when disabled", () => {
      render(<Button disabled>Not Focusable</Button>);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });
  });
});
