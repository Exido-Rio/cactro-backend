/**
 * Consistent API response helper
 */
export function successResponse(data: any, message = "Success", statusCode = 200) {
  return {
    success: true,
    statusCode,
    message,
    data,
  };
}

export function errorResponse(message: string, statusCode = 400, errors?: any) {
  return {
    success: false,
    statusCode,
    message,
    ...(errors && { errors }),
  };
}
