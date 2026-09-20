import * as React from "react";

import { cn } from "@/lib/utils";

type ValidatableElement =
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement;
type ValidatedFormProps = React.ComponentProps<"form">;

function isValidatableElement(element: Element): element is ValidatableElement {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement ||
    (element instanceof HTMLButtonElement && element.getAttribute("aria-required") === "true")
  );
}

function isInvalidField(field: ValidatableElement) {
  if (field instanceof HTMLButtonElement) return field.hasAttribute("data-placeholder");
  return !field.checkValidity();
}

function markInvalidFields(form: HTMLFormElement) {
  const invalidFields = Array.from(form.elements).filter(
    (element): element is ValidatableElement =>
      isValidatableElement(element) && isInvalidField(element),
  );

  invalidFields.forEach((field) => field.setAttribute("aria-invalid", "true"));

  return invalidFields[0] ?? null;
}

export const ValidatedForm = React.forwardRef<HTMLFormElement, ValidatedFormProps>(
  ({ className, onSubmit, onInputCapture, onClickCapture, children, ...props }, ref) => {
    const [hasValidationError, setHasValidationError] = React.useState(false);

    function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
      const form = event.currentTarget;
      if (!form.checkValidity()) {
        event.preventDefault();
        setHasValidationError(true);
        const firstInvalidField = markInvalidFields(form);
        firstInvalidField?.focus();
        return;
      }

      setHasValidationError(false);
      onSubmit?.(event);
    }

    function handleInputCapture(event: React.InputEvent<HTMLFormElement>) {
      const target = event.target as Element;
      if (isValidatableElement(target) && !isInvalidField(target)) {
        target.removeAttribute("aria-invalid");
      }
      onInputCapture?.(event);
    }

    function handleClickCapture(event: React.MouseEvent<HTMLFormElement>) {
      const selectTrigger = (event.target as Element).closest('button[aria-required="true"]');
      if (selectTrigger) {
        window.setTimeout(() => {
          if (!selectTrigger.hasAttribute("data-placeholder")) {
            selectTrigger.removeAttribute("aria-invalid");
          }
        }, 0);
      }
      onClickCapture?.(event);
    }

    return (
      <form
        {...props}
        ref={ref}
        noValidate
        className={cn(className)}
        data-validation-attempted={hasValidationError ? "true" : undefined}
        onSubmit={handleSubmit}
        onInputCapture={handleInputCapture}
        onClickCapture={handleClickCapture}
      >
        {children}
      </form>
    );
  },
);

ValidatedForm.displayName = "ValidatedForm";
