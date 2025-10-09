import { toast as sonnerToast } from "sonner";
import type { ExternalToast } from "sonner";

/**
 * Toast helper functions with typed options
 * Wraps Sonner toast API with convenience methods
 */

export type ToastOptions = ExternalToast;

/**
 * Display a success toast
 */
export function toastSuccess(message: string, options?: ToastOptions) {
  return sonnerToast.success(message, options);
}

/**
 * Display an error toast
 */
export function toastError(message: string, options?: ToastOptions) {
  return sonnerToast.error(message, options);
}

/**
 * Display an info toast
 */
export function toastInfo(message: string, options?: ToastOptions) {
  return sonnerToast.info(message, options);
}

/**
 * Display a warning toast
 */
export function toastWarning(message: string, options?: ToastOptions) {
  return sonnerToast.warning(message, options);
}

/**
 * Display a loading toast
 */
export function toastLoading(message: string, options?: ToastOptions) {
  return sonnerToast.loading(message, options);
}

/**
 * Display a promise toast with loading, success, and error states
 */
export function toastPromise<T>(
  promise: Promise<T> | (() => Promise<T>),
  options: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: unknown) => string);
  } & ToastOptions
) {
  return sonnerToast.promise(promise, options);
}

/**
 * Dismiss a specific toast by ID
 */
export function toastDismiss(toastId?: string | number) {
  return sonnerToast.dismiss(toastId);
}

/**
 * Custom toast with full control
 */
export function toast(message: string, options?: ToastOptions) {
  return sonnerToast(message, options);
}

/**
 * Re-export the entire toast API for advanced use cases
 */
export { sonnerToast as toastApi };
