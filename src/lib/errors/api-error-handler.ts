import { NextResponse } from 'next/server';
import { globalAuditLogger } from '../security/audit-logger';

export interface ApiError {
  message: string;
  statusCode?: number;
  code?: string;
  details?: Record<string, any>;
}

export class ApiErrorHandler {
  static handle(error: unknown, context?: { route?: string; userId?: string }) {
    const apiError = this.normalizeError(error);

    // Log high-severity errors
    if (apiError.statusCode && apiError.statusCode >= 500) {
      globalAuditLogger.log({
        agentName: 'API_ERROR_HANDLER',
        action: 'SERVER_ERROR',
        details: {
          message: apiError.message,
          code: apiError.code,
          route: context?.route,
          stack: error instanceof Error ? error.stack : undefined,
        },
        riskLevel: 'high',
      });
    }

    console.error(`[API Error${context?.route ? ` in ${context.route}` : ''}]:`, apiError.message);

    return NextResponse.json(
      {
        error: apiError.message,
        code: apiError.code || 'UNKNOWN_ERROR',
        details: apiError.details,
      },
      { status: apiError.statusCode || 500 }
    );
  }

  static normalizeError(error: unknown): ApiError {
    if (error instanceof Error) {
      return {
        message: error.message,
        statusCode: 500,
        code: error.name,
      };
    }

    if (typeof error === 'string') {
      return {
        message: error,
        statusCode: 500,
        code: 'STRING_ERROR',
      };
    }

    return {
      message: 'An unexpected error occurred',
      statusCode: 500,
      code: 'UNKNOWN_ERROR',
    };
  }
}

export function withApiErrorHandling(
  handler: (req: Request) => Promise<NextResponse>
) {
  return async (req: Request): Promise<NextResponse> => {
    try {
      return await handler(req);
    } catch (error) {
      return ApiErrorHandler.handle(error, {
        route: new URL(req.url).pathname,
      });
    }
  };
}
