import pyotp
from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from common.errors import InvalidTotpCode, InvalidBackupCode, RateLimited
from .models import AdminUser, AdminBackupCode, AdminSession
from .permissions import IsAdminSession, get_bearer_token


class AdminLoginThrottle(AnonRateThrottle):
    scope = "admin_login"


def _issue_session(admin_user):
    session = AdminSession.objects.create(admin_user=admin_user)
    return Response({"session_token": session.token, "expires_at": session.expires_at})


class AdminLoginView(APIView):
    """POST /api/admin/login — AU-02. Body: { totp_code }."""

    permission_classes = [AllowAny]
    throttle_classes = [AdminLoginThrottle]

    def post(self, request):
        totp_code = str(request.data.get("totp_code", "")).strip()
        admin_user = AdminUser.objects.filter(is_active=True).first()
        if not admin_user or not totp_code:
            raise InvalidTotpCode()

        totp = pyotp.TOTP(admin_user.totp_secret)
        if not totp.verify(totp_code, valid_window=1):
            raise InvalidTotpCode()

        return _issue_session(admin_user)


class AdminBackupCodeLoginView(APIView):
    """POST /api/admin/login/backup-code — AU-03. Body: { backup_code }."""

    permission_classes = [AllowAny]
    throttle_classes = [AdminLoginThrottle]

    def post(self, request):
        raw_code = str(request.data.get("backup_code", "")).strip()
        if not raw_code:
            raise InvalidBackupCode()

        code_hash = AdminBackupCode.hash_code(raw_code)
        try:
            backup_code = AdminBackupCode.objects.select_related("admin_user").get(
                code_hash=code_hash, used_at__isnull=True
            )
        except AdminBackupCode.DoesNotExist:
            raise InvalidBackupCode()

        backup_code.used_at = timezone.now()
        backup_code.save(update_fields=["used_at"])

        return _issue_session(backup_code.admin_user)


class AdminLogoutView(APIView):
    """POST /api/admin/logout — invalidates the current session token."""

    permission_classes = [IsAdminSession]

    def post(self, request):
        request.admin_session.delete()
        return Response(status=204)


class AdminSessionCheckView(APIView):
    """GET /api/admin/session — lets the dashboard verify a stored token
    without side effects, and know when it expires."""

    permission_classes = [IsAdminSession]

    def get(self, request):
        return Response(
            {
                "username": request.admin_user.username,
                "expires_at": request.admin_session.expires_at,
            }
        )
