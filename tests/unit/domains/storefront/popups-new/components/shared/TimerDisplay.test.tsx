import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TimerDisplay } from "~/domains/storefront/popups-new/components/shared/TimerDisplay";
import type { TimeRemaining } from "~/domains/storefront/popups-new/hooks/useCountdownTimer";

describe("TimerDisplay", () => {
  const mockTimeRemaining: TimeRemaining = {
    total: 7265000, // 2h 1m 5s
    days: 0,
    hours: 2,
    minutes: 1,
    seconds: 5,
  };

  const mockTimeWithDays: TimeRemaining = {
    total: 180065000, // 2d 2h 1m 5s
    days: 2,
    hours: 2,
    minutes: 1,
    seconds: 5,
  };

  describe("Full Format (default)", () => {
    it("renders all time units with labels", () => {
      render(<TimerDisplay timeRemaining={mockTimeRemaining} />);
      expect(screen.getByText("02")).toBeInTheDocument(); // hours
      expect(screen.getByText("01")).toBeInTheDocument(); // minutes
      expect(screen.getByText("05")).toBeInTheDocument(); // seconds
      expect(screen.getByText("Hours")).toBeInTheDocument();
      expect(screen.getByText("Mins")).toBeInTheDocument();
      expect(screen.getByText("Secs")).toBeInTheDocument();
    });

    it("renders days when available", () => {
      render(<TimerDisplay timeRemaining={mockTimeWithDays} />);
      expect(screen.getByText("Days")).toBeInTheDocument();
    });

    it("hides days when showDays is false", () => {
      render(<TimerDisplay timeRemaining={mockTimeWithDays} showDays={false} />);
      expect(screen.queryByText("Days")).not.toBeInTheDocument();
    });

    it("hides labels when showLabels is false", () => {
      render(<TimerDisplay timeRemaining={mockTimeRemaining} showLabels={false} />);
      expect(screen.queryByText("Hours")).not.toBeInTheDocument();
      expect(screen.queryByText("Mins")).not.toBeInTheDocument();
      expect(screen.queryByText("Secs")).not.toBeInTheDocument();
    });

    it("renders separators between units", () => {
      const { container } = render(<TimerDisplay timeRemaining={mockTimeRemaining} />);
      const separators = container.querySelectorAll("span");
      expect(separators.length).toBeGreaterThan(0);
    });
  });

  describe("Compact Format", () => {
    it("renders time in HH:MM:SS format", () => {
      const { container } = render(
        <TimerDisplay timeRemaining={mockTimeRemaining} format="compact" />
      );
      expect(container.textContent).toBe("02:01:05");
    });

    it("includes days in compact format when available", () => {
      const { container } = render(
        <TimerDisplay timeRemaining={mockTimeWithDays} format="compact" />
      );
      expect(container.textContent).toBe("02:02:01:05");
    });

    it("excludes days in compact format when showDays is false", () => {
      const { container } = render(
        <TimerDisplay timeRemaining={mockTimeWithDays} format="compact" showDays={false} />
      );
      expect(container.textContent).toBe("02:01:05");
    });

    it("shows 00:00:00 when timer expired", () => {
      const expiredTime: TimeRemaining = { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
      const { container } = render(<TimerDisplay timeRemaining={expiredTime} format="compact" />);
      expect(container.textContent).toBe("00:00:00");
    });
  });

  describe("Minimal Format", () => {
    it("renders time in text format with units", () => {
      const { container } = render(
        <TimerDisplay timeRemaining={mockTimeRemaining} format="minimal" />
      );
      expect(container.textContent).toBe("2h 1m 5s");
    });

    it("includes days in minimal format when available", () => {
      const { container } = render(
        <TimerDisplay timeRemaining={mockTimeWithDays} format="minimal" />
      );
      // When days are present, seconds are excluded
      expect(container.textContent).toBe("2d 2h 1m");
    });

    it("excludes seconds when days are present", () => {
      const { container } = render(
        <TimerDisplay timeRemaining={mockTimeWithDays} format="minimal" />
      );
      expect(container.textContent).not.toContain("5s");
    });

    it("excludes days when showDays is false", () => {
      const { container } = render(
        <TimerDisplay timeRemaining={mockTimeWithDays} format="minimal" showDays={false} />
      );
      expect(container.textContent).not.toContain("2d");
    });

    it("shows 00:00:00 when timer expired", () => {
      const expiredTime: TimeRemaining = { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
      const { container } = render(<TimerDisplay timeRemaining={expiredTime} format="minimal" />);
      expect(container.textContent).toBe("00:00:00");
    });
  });

  describe("Colors", () => {
    it("renders with default accent color", () => {
      const { container } = render(<TimerDisplay timeRemaining={mockTimeRemaining} />);
      // Just verify it renders without errors
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders with custom accent color", () => {
      const { container } = render(
        <TimerDisplay timeRemaining={mockTimeRemaining} accentColor="#00ff00" />
      );
      // Just verify it renders without errors
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders with custom text color", () => {
      const { container } = render(
        <TimerDisplay timeRemaining={mockTimeRemaining} textColor="#333333" />
      );
      // Just verify it renders without errors
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders with custom background color", () => {
      const { container } = render(
        <TimerDisplay timeRemaining={mockTimeRemaining} backgroundColor="#f0f0f0" />
      );
      // Just verify it renders without errors
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("Typography", () => {
    it("renders with default font size", () => {
      const { container } = render(<TimerDisplay timeRemaining={mockTimeRemaining} />);
      // Just verify it renders without errors
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders with custom font size", () => {
      const { container } = render(
        <TimerDisplay timeRemaining={mockTimeRemaining} fontSize="2rem" />
      );
      // Just verify it renders without errors
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders with default font weight", () => {
      const { container } = render(<TimerDisplay timeRemaining={mockTimeRemaining} />);
      // Just verify it renders without errors
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders with custom font weight", () => {
      const { container } = render(
        <TimerDisplay timeRemaining={mockTimeRemaining} fontWeight="900" />
      );
      // Just verify it renders without errors
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("Custom Styling", () => {
    it("applies custom className", () => {
      const { container } = render(
        <TimerDisplay timeRemaining={mockTimeRemaining} className="custom-class" />
      );
      const wrapper = container.querySelector(".custom-class");
      expect(wrapper).toBeInTheDocument();
    });

    it("applies custom inline styles", () => {
      const { container } = render(
        <TimerDisplay timeRemaining={mockTimeRemaining} style={{ marginTop: "20px" }} />
      );
      const wrapper = container.querySelector("div");
      expect(wrapper?.style.marginTop).toBe("20px");
    });
  });
});

