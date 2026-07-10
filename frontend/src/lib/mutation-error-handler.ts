import { toast } from "sonner"
import type { FieldValues, Path, UseFormSetError } from "react-hook-form"
import { ApiError, BadRequestError, ValidationError } from "@/api/errors"

type MutationErrorOptions<T extends FieldValues = FieldValues> = {
  setError?: UseFormSetError<T>
}

/**
 * Default mutation error handler.
 * - Displays a toast with the error message
 * - If setError is provided, maps field-level errors from the backend response
 */
export function handleMutationError<T extends FieldValues = FieldValues>(
  error: unknown,
  options?: MutationErrorOptions<T>
) {
  const { setError } = options ?? {}

  // Field-level mapping for 400/422 responses
  if (
    (error instanceof BadRequestError || error instanceof ValidationError) &&
    setError
  ) {
    const body = error.body as Record<string, string[] | string>

    // Non-field errors → toast
    const nonFieldErrors =
      (body.nonFieldErrors as string[] | undefined) ??
      (body.detail ? [body.detail as string] : undefined)

    if (nonFieldErrors) {
      toast.error(nonFieldErrors.join(", "))
    }

    // Map each field error
    let hasFieldError = false
    for (const [field, messages] of Object.entries(body)) {
      if (field === "nonFieldErrors" || field === "detail") continue
      if (Array.isArray(messages) && messages.length > 0) {
        setError(field as Path<T>, { message: messages[0] })
        hasFieldError = true
      }
    }

    // If we mapped at least one field error, don't show a generic toast
    if (hasFieldError) return

    // If no field errors were mapped, show a generic toast
    if (!nonFieldErrors) {
      toast.error("Erreur de validation")
    }
    return
  }

  // ApiError without form → toast with message
  if (error instanceof ApiError) {
    const body = error.body as Record<string, unknown> | undefined
    const detail = body?.detail ?? body?.nonFieldErrors ?? error.message
    const message = Array.isArray(detail) ? detail.join(", ") : String(detail)
    toast.error(message)
    return
  }

  // Generic error
  toast.error(
    error instanceof Error
      ? error.message
      : "Une erreur inattendue est survenue"
  )
}
