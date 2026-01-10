import { type NextRequest, NextResponse } from "next/server"
import { ApiError, ValidationError, AuthenticationError } from "@/lib/errors"
import { logger } from "@/lib/logger"
import { getSession } from "@/lib/auth"

export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>,
) {
  try {
    const session = await getSession()

    if (!session?.userId) {
      throw new AuthenticationError("Please log in to continue")
    }

    return await handler(request, session.userId)
  } catch (error) {
    return handleError(error)
  }
}

export async function withErrorHandling(handler: () => Promise<NextResponse>) {
  try {
    return await handler()
  } catch (error) {
    return handleError(error)
  }
}

export function handleError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    logger.warn(`API Error [${error.code}]: ${error.message}`)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode },
    )
  }

  if (error instanceof Error) {
    logger.error("Unexpected error", error)
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred. Please try again.",
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 },
    )
  }

  logger.error("Unknown error", error)
  return NextResponse.json(
    {
      success: false,
      error: "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
    },
    { status: 500 },
  )
}

export function validateRequest<T>(data: unknown, requiredFields: (keyof T)[]): data is T {
  if (!data || typeof data !== "object") {
    throw new ValidationError("Invalid request body")
  }

  const obj = data as Record<string, unknown>

  for (const field of requiredFields) {
    if (!obj[field as string]) {
      throw new ValidationError(`Missing required field: ${String(field)}`)
    }
  }

  return true
}
