import { useMutation, type UseMutationOptions } from "@tanstack/react-query"
import { handleMutationError } from "./mutation-error-handler"

/**
 * Wrapper around useMutation that injects a default onError handler.
 * The default shows a toast via handleMutationError.
 * Callers can override onError in the options or at .mutate() call site.
 */
export function useMutationWithDefaults<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(options: UseMutationOptions<TData, TError, TVariables, TContext>) {
  return useMutation<TData, TError, TVariables, TContext>({
    ...options,
    onError: options.onError ?? ((error) => handleMutationError(error)),
  })
}
