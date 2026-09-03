import { AxiosError } from "axios";

interface BackendValidationError {
  field?: string;
  path?: string | string[];
  message?: string;
}

interface BackendErrorResponse {
  statusCode?: number;
  message?: string | string[];
  errors?: BackendValidationError[];
  error?: string;
}

/**
 * Transforms raw backend responses, database exceptions, Zod validation arrays,
 * and HTTP status codes into clear, natural, human-friendly messages for non-technical users.
 */
export function getFriendlyErrorMessage(
  error: unknown,
  fallbackMessage: string = "Something went wrong. Please try again."
): string {
  // 1. Handle offline / network disconnects
  if (!navigator.onLine) {
    return "You appear to be offline. Please check your internet connection.";
  }

  // 2. Handle Axios network & timeout errors
  if (error && typeof error === "object" && "isAxiosError" in error) {
    const axiosErr = error as AxiosError<BackendErrorResponse>;

    if (axiosErr.code === "ECONNABORTED" || axiosErr.message.includes("timeout")) {
      return "The connection timed out. Please verify your connection and try again.";
    }

    if (axiosErr.message === "Network Error" || !axiosErr.response) {
      return "Unable to reach the server. Please check your internet connection or try again shortly.";
    }

    const status = axiosErr.response.status;
    const data = axiosErr.response.data;

    // Check for detailed field validation errors (from NestJS ZodValidationPipe or HttpExceptionFilter)
    if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      const firstError = data.errors[0];
      const field = Array.isArray(firstError.path)
        ? firstError.path.join(".")
        : firstError.field || "";
      const rawMsg = firstError.message || "";

      // Friendly translations for common fields
      if (field.includes("phone")) {
        return "Please enter a valid 11-digit Bangladeshi mobile number starting with 013–019.";
      }
      if (field.includes("email")) {
        return "Please provide a valid email address.";
      }
      if (field.includes("password")) {
        return "Your password must be at least 8 characters long.";
      }
      if (field.includes("streetAddress") || field.includes("address")) {
        return "Please provide your detailed street address for delivery.";
      }
      if (field.includes("district") || field.includes("division")) {
        return "Please select your delivery district and division.";
      }
      if (field.includes("size") || field.includes("variant")) {
        return "Please select a product size to proceed.";
      }
      if (field.includes("quantity")) {
        return "Please specify a valid item quantity.";
      }

      // If rawMsg is readable and doesn't contain technical jargon, use it
      if (rawMsg && !isTechnicalJargon(rawMsg)) {
        return cleanTechnicalJargon(rawMsg);
      }
    }

    // Check message field
    const serverMessage = Array.isArray(data?.message)
      ? data.message[0]
      : data?.message || data?.error;

    if (serverMessage && typeof serverMessage === "string") {
      const lower = serverMessage.toLowerCase();

      // Authentication & Credentials
      if (lower.includes("invalid credentials") || lower.includes("invalid email or password")) {
        return "Incorrect email or password. Please verify your details and try again.";
      }
      if (lower.includes("user not found")) {
        return "No account was found with this email address.";
      }
      if (lower.includes("unauthorized") || lower.includes("jwt") || lower.includes("token")) {
        return "Your session has expired. Please sign in again to continue.";
      }
      if (lower.includes("already exists") || lower.includes("unique constraint") || lower.includes("duplicate")) {
        if (lower.includes("email")) {
          return "An account with this email address already exists. Please sign in instead.";
        }
        if (lower.includes("phone")) {
          return "This phone number is already linked to another account.";
        }
        return "This information is already registered. Please sign in or use different details.";
      }

      // Stock & Inventory
      if (lower.includes("stock") || lower.includes("insufficient") || lower.includes("inventory")) {
        return "Sorry, this product is currently out of stock or requested quantity exceeds available stock.";
      }

      // Orders & Delivery
      if (lower.includes("deliveryzone") || lower.includes("delivery zone")) {
        return "Please select a valid delivery zone (Inside Dhaka ৳60 or Outside Dhaka ৳120).";
      }
      if (lower.includes("cart is empty")) {
        return "Your shopping cart is currently empty. Please add items before placing an order.";
      }
      if (lower.includes("order not found")) {
        return "We couldn't find an order matching that order number. Please verify the number and try again.";
      }

      // If serverMessage doesn't look like an unhandled code exception
      if (!isTechnicalJargon(serverMessage)) {
        return cleanTechnicalJargon(serverMessage);
      }
    }

    // Status code fallbacks
    switch (status) {
      case 400:
        return "Some of the provided information is incomplete or invalid. Please check your inputs and try again.";
      case 401:
        return "Please sign in to complete this action.";
      case 403:
        return "You don't have permission to perform this action.";
      case 404:
        return "The requested information or product could not be found.";
      case 409:
        return "This item or information already exists. Please review your details.";
      case 422:
        return "Please check the information you entered and try again.";
      case 429:
        return "Too many requests. Please wait a few moments and try again.";
      case 500:
      case 502:
      case 503:
      case 504:
        return "Our servers are momentarily busy. Please try again in a few moments.";
      default:
        return fallbackMessage;
    }
  }

  // 3. Handle standard JavaScript Error
  if (error instanceof Error) {
    if (isTechnicalJargon(error.message)) {
      return fallbackMessage;
    }
    return cleanTechnicalJargon(error.message);
  }

  return fallbackMessage;
}

/**
 * Detects whether a string is a raw programming error or technical dump.
 */
function isTechnicalJargon(text: string): boolean {
  const technicalPatterns = [
    /prisma/i,
    /typeerror/i,
    /referenceerror/i,
    /syntaxerror/i,
    /cannot (post|get|put|delete|patch)/i,
    /internal server error/i,
    /failed with status code/i,
    /undefined/i,
    /null/i,
    /\{.*\}/,
    /\[.*\]/,
    /object object/i,
    /sql/i,
    /query/i,
    /constraint/i,
    /zod/i,
    /regex/i,
    /expected .* received/i,
    /stack trace/i,
    /errno/i,
    /econnrefused/i,
  ];

  return technicalPatterns.some((pattern) => pattern.test(text));
}

/**
 * Removes technical prefixes like "Error: ", "Bad Request: " from otherwise friendly messages.
 */
function cleanTechnicalJargon(text: string): string {
  return text
    .replace(/^error:\s*/i, "")
    .replace(/^bad request:\s*/i, "")
    .replace(/^validation failed:\s*/i, "")
    .replace(/^unauthorized:\s*/i, "")
    .trim();
}
