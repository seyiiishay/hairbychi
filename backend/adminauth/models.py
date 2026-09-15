import hashlib
import secrets
import uuid
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone

from common.models import TimestampedModel


class AdminUser(TimestampedModel):
    """
    Single stylist for v1 (PRD Section 2) — the data model doesn't hardcode
    that (multiple rows are allowed), but there is normally exactly one
    active row per environment/database. TOTP-based login, decoupled from
    Django's own auth.User so it can be swapped out later without touching
    business logic (PRD Section 9).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=80, unique=True)
    totp_secret = models.CharField(max_length=64)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.username


class AdminBackupCode(models.Model):
    """One-time recovery codes issued at TOTP setup (AU-03). Stored hashed;
    the raw code is shown to the stylist exactly once, at generation time."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    admin_user = models.ForeignKey(AdminUser, related_name="backup_codes", on_delete=models.CASCADE)
    code_hash = models.CharField(max_length=64)
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @staticmethod
    def hash_code(raw_code):
        return hashlib.sha256(raw_code.strip().upper().encode()).hexdigest()

    @classmethod
    def generate_set(cls, admin_user, count=10):
        """Creates `count` fresh backup codes, returns the raw codes (only chance to see them)."""
        cls.objects.filter(admin_user=admin_user, used_at__isnull=True).delete()
        raw_codes = []
        for _ in range(count):
            raw = "-".join(secrets.token_hex(2).upper() for _ in range(2))
            raw_codes.append(raw)
            cls.objects.create(admin_user=admin_user, code_hash=cls.hash_code(raw))
        return raw_codes


def generate_session_token():
    return secrets.token_urlsafe(40)


class AdminSession(models.Model):
    token = models.CharField(max_length=64, primary_key=True, default=generate_session_token)
    admin_user = models.ForeignKey(AdminUser, related_name="sessions", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + settings.ADMIN_SESSION_LIFETIME
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at
