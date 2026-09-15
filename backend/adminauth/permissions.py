from django.utils import timezone
from rest_framework.permissions import BasePermission

from common.errors import Unauthorized
from .models import AdminSession


def get_bearer_token(request):
    header = request.headers.get("Authorization", "")
    if header.startswith("Bearer "):
        return header[len("Bearer "):].strip()
    return None


class IsAdminSession(BasePermission):
    """
    Every /api/admin/* endpoint (except login) requires a valid,
    non-expired session_token from TOTP or backup-code login, sent as
    `Authorization: Bearer <session_token>`.
    """

    message = "Your session has expired. Please log in again."

    def has_permission(self, request, view):
        token = get_bearer_token(request)
        if not token:
            raise Unauthorized()

        try:
            session = AdminSession.objects.select_related("admin_user").get(token=token)
        except AdminSession.DoesNotExist:
            raise Unauthorized()

        if session.is_expired or not session.admin_user.is_active:
            raise Unauthorized()

        request.admin_session = session
        request.admin_user = session.admin_user
        return True
