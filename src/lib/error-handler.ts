/**
 * Централизованная обработка ошибок
 */

export interface ErrorInfo {
  message: string;
  code?: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

export function logError(error: unknown, context?: Record<string, unknown>): ErrorInfo {
  const errorInfo: ErrorInfo = {
    message: error instanceof Error ? error.message : String(error),
    code: error instanceof Error && "code" in error ? String(error.code) : undefined,
    context,
    timestamp: new Date().toISOString(),
  };

  // В production здесь можно отправлять в сервис мониторинга (Sentry, LogRocket и т.д.)
  if (process.env.NODE_ENV === "development") {
    console.error("Error logged:", errorInfo);
  }

  return errorInfo;
}

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Произошла непредвиденная ошибка";
}

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "AppError";
  }
}

