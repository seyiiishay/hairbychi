import logging

from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework.response import Response
from rest_framework import status as http_status

from .errors import ApiError

logger = logging.getLogger("api.errors")


def api_exception_handler(exc, context):
    """
    Normalizes every error response to { "error": { "code", "message" } }.
    Never leaks stack traces or raw third-party (e.g. Stripe) error codes.
    """
    if isinstance(exc, ApiError):
        return Response({"error": {"code": exc.code, "message": exc.message}}, status=exc.status_code)

    response = drf_exception_handler(exc, context)

    if response is None:
        # Unhandled exception -> generic 500, log full detail server-side only.
        logger.exception("Unhandled exception in %s", context.get("view"))
        return Response(
            {"error": {"code": "internal_error", "message": "Something went wrong. Please try again."}},
            status=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    code = "validation_error"
    message = "Please check your input and try again."

    if response.status_code == http_status.HTTP_401_UNAUTHORIZED:
        code, message = "unauthorized", "Your session has expired. Please log in again."
    elif response.status_code == http_status.HTTP_403_FORBIDDEN:
        code, message = "forbidden", "You don't have permission to do that."
    elif response.status_code == http_status.HTTP_404_NOT_FOUND:
        code, message = "not_found", "Not found."
    elif response.status_code == http_status.HTTP_429_TOO_MANY_REQUESTS:
        code, message = "rate_limited", "Too many attempts. Please wait and try again."

    detail = response.data
    field_errors = None
    if isinstance(detail, dict) and not ("detail" in detail and len(detail) == 1):
        field_errors = detail

    error_body = {"code": code, "message": message}
    if field_errors:
        error_body["fields"] = field_errors

    response.data = {"error": error_body}
    return response
