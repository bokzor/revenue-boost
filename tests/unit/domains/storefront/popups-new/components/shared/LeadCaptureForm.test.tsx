import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LeadCaptureForm } from "~/domains/storefront/popups-new/components/shared/LeadCaptureForm";

describe("LeadCaptureForm", () => {
  const defaultProps = {
    data: { email: "", name: "", gdprConsent: false },
    errors: {},
    onEmailChange: vi.fn(),
    onNameChange: vi.fn(),
    onGdprChange: vi.fn(),
    onSubmit: vi.fn(),
    isSubmitting: false,
  };

  describe("Basic Rendering", () => {
    it("renders email input by default", () => {
      render(<LeadCaptureForm {...defaultProps} />);
      expect(screen.getByPlaceholderText("Enter your email")).toBeInTheDocument();
    });

    it("renders submit button", () => {
      render(<LeadCaptureForm {...defaultProps} />);
      expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
    });

    it("does not render name field by default", () => {
      render(<LeadCaptureForm {...defaultProps} />);
      expect(screen.queryByPlaceholderText("Enter your name")).not.toBeInTheDocument();
    });

    it("does not render GDPR checkbox by default", () => {
      render(<LeadCaptureForm {...defaultProps} />);
      expect(screen.queryByText(/agree to receive/i)).not.toBeInTheDocument();
    });
  });

  describe("Optional Fields", () => {
    it("renders name field when showName is true", () => {
      render(<LeadCaptureForm {...defaultProps} showName={true} />);
      expect(screen.getByPlaceholderText("Enter your name")).toBeInTheDocument();
    });

    it("renders GDPR checkbox when showGdpr is true", () => {
      render(<LeadCaptureForm {...defaultProps} showGdpr={true} />);
      expect(screen.getByText(/agree to receive marketing emails/i)).toBeInTheDocument();
    });

    it("renders both name and GDPR when both are enabled", () => {
      render(<LeadCaptureForm {...defaultProps} showName={true} showGdpr={true} />);
      expect(screen.getByPlaceholderText("Enter your name")).toBeInTheDocument();
      expect(screen.getByText(/agree to receive marketing emails/i)).toBeInTheDocument();
    });
  });

  describe("Form Interactions", () => {
    it("calls onEmailChange when email input changes", () => {
      const onEmailChange = vi.fn();
      render(<LeadCaptureForm {...defaultProps} onEmailChange={onEmailChange} />);
      const emailInput = screen.getByPlaceholderText("Enter your email");
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      expect(onEmailChange).toHaveBeenCalledWith("test@example.com");
    });

    it("calls onNameChange when name input changes", () => {
      const onNameChange = vi.fn();
      render(<LeadCaptureForm {...defaultProps} showName={true} onNameChange={onNameChange} />);
      const nameInput = screen.getByPlaceholderText("Enter your name");
      fireEvent.change(nameInput, { target: { value: "John Doe" } });
      expect(onNameChange).toHaveBeenCalledWith("John Doe");
    });

    it("calls onGdprChange when checkbox is clicked", () => {
      const onGdprChange = vi.fn();
      render(<LeadCaptureForm {...defaultProps} showGdpr={true} onGdprChange={onGdprChange} />);
      const checkbox = screen.getByRole("checkbox");
      fireEvent.click(checkbox);
      expect(onGdprChange).toHaveBeenCalledWith(true);
    });

    it("calls onSubmit when form is submitted", () => {
      const onSubmit = vi.fn();
      render(<LeadCaptureForm {...defaultProps} onSubmit={onSubmit} />);
      const form = screen.getByRole("button", { name: /submit/i }).closest("form");
      fireEvent.submit(form!);
      expect(onSubmit).toHaveBeenCalled();
    });

    it("prevents default form submission", () => {
      const onSubmit = vi.fn();
      render(<LeadCaptureForm {...defaultProps} onSubmit={onSubmit} />);
      const form = screen.getByRole("button", { name: /submit/i }).closest("form");
      const event = new Event("submit", { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");
      form?.dispatchEvent(event);
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe("Validation Errors", () => {
    it("displays email error", () => {
      render(<LeadCaptureForm {...defaultProps} errors={{ email: "Email is required" }} />);
      expect(screen.getByText("Email is required")).toBeInTheDocument();
    });

    it("displays name error", () => {
      render(
        <LeadCaptureForm
          {...defaultProps}
          showName={true}
          errors={{ name: "Name is required" }}
        />
      );
      expect(screen.getByText("Name is required")).toBeInTheDocument();
    });

    it("displays GDPR error", () => {
      render(
        <LeadCaptureForm
          {...defaultProps}
          showGdpr={true}
          errors={{ gdpr: "You must agree to continue" }}
        />
      );
      expect(screen.getByText("You must agree to continue")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("disables all inputs when submitting", () => {
      render(<LeadCaptureForm {...defaultProps} isSubmitting={true} showName={true} showGdpr={true} />);
      expect(screen.getByPlaceholderText("Enter your email")).toBeDisabled();
      expect(screen.getByPlaceholderText("Enter your name")).toBeDisabled();
      expect(screen.getByRole("checkbox")).toBeDisabled();
    });

    it("disables submit button when submitting", () => {
      render(<LeadCaptureForm {...defaultProps} isSubmitting={true} />);
      expect(screen.getByRole("button", { name: /submit/i })).toBeDisabled();
    });
  });

  describe("Custom Labels", () => {
    it("uses custom email label", () => {
      render(<LeadCaptureForm {...defaultProps} labels={{ email: "Email Address" }} />);
      expect(screen.getByText("Email Address")).toBeInTheDocument();
    });

    it("uses custom name label", () => {
      render(<LeadCaptureForm {...defaultProps} showName={true} labels={{ name: "Full Name" }} />);
      expect(screen.getByText("Full Name")).toBeInTheDocument();
    });

    it("uses custom GDPR label", () => {
      render(
        <LeadCaptureForm
          {...defaultProps}
          showGdpr={true}
          labels={{ gdpr: "I agree to terms" }}
        />
      );
      expect(screen.getByText("I agree to terms")).toBeInTheDocument();
    });

    it("uses custom submit button text", () => {
      render(<LeadCaptureForm {...defaultProps} labels={{ submit: "Subscribe Now" }} />);
      expect(screen.getByRole("button", { name: "Subscribe Now" })).toBeInTheDocument();
    });
  });

  describe("Custom Placeholders", () => {
    it("uses custom email placeholder", () => {
      render(
        <LeadCaptureForm {...defaultProps} placeholders={{ email: "Your email address" }} />
      );
      expect(screen.getByPlaceholderText("Your email address")).toBeInTheDocument();
    });

    it("uses custom name placeholder", () => {
      render(
        <LeadCaptureForm
          {...defaultProps}
          showName={true}
          placeholders={{ name: "Your full name" }}
        />
      );
      expect(screen.getByPlaceholderText("Your full name")).toBeInTheDocument();
    });
  });

  describe("Extra Fields Slot", () => {
    it("renders extra fields between inputs and submit button", () => {
      render(
        <LeadCaptureForm
          {...defaultProps}
          extraFields={<input data-testid="extra-field" placeholder="Phone number" />}
        />
      );
      expect(screen.getByTestId("extra-field")).toBeInTheDocument();
    });
  });
});

