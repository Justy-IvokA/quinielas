import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast as sonnerToast } from "sonner";
import {
  toast,
  toastSuccess,
  toastError,
  toastInfo,
  toastWarning,
  toastLoading,
  toastPromise,
  toastDismiss
} from "../toast";

// Mock sonner
vi.mock("sonner", () => ({
  toast: vi.fn((message, options) => ({ id: "toast-1", message, ...options })),
  default: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
    promise: vi.fn(),
    dismiss: vi.fn()
  }
}));

describe("Toast Helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("toastSuccess", () => {
    it("should call sonner success with message", () => {
      const message = "Operation successful";
      toastSuccess(message);

      expect(sonnerToast.success).toHaveBeenCalledWith(message, undefined);
    });

    it("should call sonner success with message and options", () => {
      const message = "Operation successful";
      const options = { description: "Details here" };
      toastSuccess(message, options);

      expect(sonnerToast.success).toHaveBeenCalledWith(message, options);
    });
  });

  describe("toastError", () => {
    it("should call sonner error with message", () => {
      const message = "Operation failed";
      toastError(message);

      expect(sonnerToast.error).toHaveBeenCalledWith(message, undefined);
    });

    it("should call sonner error with message and options", () => {
      const message = "Operation failed";
      const options = { description: "Error details" };
      toastError(message, options);

      expect(sonnerToast.error).toHaveBeenCalledWith(message, options);
    });
  });

  describe("toastInfo", () => {
    it("should call sonner info with message", () => {
      const message = "Information";
      toastInfo(message);

      expect(sonnerToast.info).toHaveBeenCalledWith(message, undefined);
    });

    it("should call sonner info with message and options", () => {
      const message = "Information";
      const options = { duration: 5000 };
      toastInfo(message, options);

      expect(sonnerToast.info).toHaveBeenCalledWith(message, options);
    });
  });

  describe("toastWarning", () => {
    it("should call sonner warning with message", () => {
      const message = "Warning message";
      toastWarning(message);

      expect(sonnerToast.warning).toHaveBeenCalledWith(message, undefined);
    });

    it("should call sonner warning with message and options", () => {
      const message = "Warning message";
      const options = { duration: 3000 };
      toastWarning(message, options);

      expect(sonnerToast.warning).toHaveBeenCalledWith(message, options);
    });
  });

  describe("toastLoading", () => {
    it("should call sonner loading with message", () => {
      const message = "Loading...";
      toastLoading(message);

      expect(sonnerToast.loading).toHaveBeenCalledWith(message, undefined);
    });

    it("should call sonner loading with message and options", () => {
      const message = "Loading...";
      const options = { duration: Infinity };
      toastLoading(message, options);

      expect(sonnerToast.loading).toHaveBeenCalledWith(message, options);
    });
  });

  describe("toastPromise", () => {
    it("should call sonner promise with promise and messages", async () => {
      const promise = Promise.resolve("success");
      const options = {
        loading: "Loading...",
        success: "Success!",
        error: "Error!"
      };

      toastPromise(promise, options);

      expect(sonnerToast.promise).toHaveBeenCalledWith(promise, options);
    });

    it("should call sonner promise with promise function", () => {
      const promiseFn = () => Promise.resolve("success");
      const options = {
        loading: "Loading...",
        success: "Success!",
        error: "Error!"
      };

      toastPromise(promiseFn, options);

      expect(sonnerToast.promise).toHaveBeenCalledWith(promiseFn, options);
    });

    it("should support dynamic success message", () => {
      const promise = Promise.resolve({ name: "Test" });
      const options = {
        loading: "Loading...",
        success: (data: { name: string }) => `Loaded ${data.name}`,
        error: "Error!"
      };

      toastPromise(promise, options);

      expect(sonnerToast.promise).toHaveBeenCalledWith(promise, options);
    });

    it("should support dynamic error message", () => {
      const promise = Promise.reject(new Error("Failed"));
      const options = {
        loading: "Loading...",
        success: "Success!",
        error: (err: unknown) => `Error: ${(err as Error).message}`
      };

      toastPromise(promise, options);

      expect(sonnerToast.promise).toHaveBeenCalledWith(promise, options);
    });
  });

  describe("toastDismiss", () => {
    it("should call sonner dismiss without ID", () => {
      toastDismiss();

      expect(sonnerToast.dismiss).toHaveBeenCalledWith(undefined);
    });

    it("should call sonner dismiss with string ID", () => {
      const toastId = "toast-123";
      toastDismiss(toastId);

      expect(sonnerToast.dismiss).toHaveBeenCalledWith(toastId);
    });

    it("should call sonner dismiss with number ID", () => {
      const toastId = 123;
      toastDismiss(toastId);

      expect(sonnerToast.dismiss).toHaveBeenCalledWith(toastId);
    });
  });

  describe("toast (custom)", () => {
    it("should call sonner toast with message", () => {
      const message = "Custom toast";
      toast(message);

      expect(sonnerToast).toHaveBeenCalledWith(message, undefined);
    });

    it("should call sonner toast with message and options", () => {
      const message = "Custom toast";
      const options = { duration: 2000 };
      toast(message, options);

      expect(sonnerToast).toHaveBeenCalledWith(message, options);
    });
  });
});
