// Typed application errors for consistent HTTP responses.
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(statusCode: number, message: string, details?: Record<string, unknown>) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Convenience helpers to keep services concise.
export const notFound = (message: string) => new AppError(404, message);
export const badRequest = (message: string, details?: Record<string, unknown>) =>
  new AppError(400, message, details);
export const forbidden = (message: string) => new AppError(403, message);
export const conflict = (message: string) => new AppError(409, message);
