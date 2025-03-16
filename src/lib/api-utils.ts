import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true,
    public stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export function successResponse<T>(data: T, statusCode = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status: statusCode }
  );
}

export function errorResponse(error: Error | ApiError, statusCode = 500) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message: error.message,
        ...(error instanceof ApiError && { statusCode: error.statusCode }),
      },
    },
    { status: statusCode }
  );
}

export function validateRequest(
  request: Request,
  method: string
): Promise<{ body: any }> {
  if (request.method !== method) {
    throw new ApiError(405, `Method ${request.method} not allowed`);
  }

  return request.json()
    .then(body => {
      if (!body || Object.keys(body).length === 0) {
        console.error("빈 요청 본문이 수신됨:", body);
        throw new ApiError(400, "요청 본문이 비어 있습니다");
      }
      return { body };
    })
    .catch((error) => {
      console.error("JSON 파싱 오류:", error);
      throw new ApiError(400, "유효하지 않은 JSON 형식: " + error.message);
    });
} 