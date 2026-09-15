import pyotp
from django.conf import settings
from django.core.management.base import BaseCommand

from adminauth.models import AdminUser, AdminBackupCode


class Command(BaseCommand):
    help = (
        "Creates (or rotates) the stylist's TOTP admin credential and prints "
        "the otpauth:// provisioning URI (scan into an authenticator app) "
        "plus a fresh set of one-time backup codes. Run once per environment "
        "(staging and production get separate credentials, per PRD Section 12)."
    )

    def add_arguments(self, parser):
        parser.add_argument("--username", default="chi")
        parser.add_argument(
            "--rotate",
            action="store_true",
            help="Generate a new TOTP secret for an existing user (invalidates old authenticator entry).",
        )

    def handle(self, *args, **options):
        username = options["username"]
        admin_user, created = AdminUser.objects.get_or_create(
            username=username, defaults={"totp_secret": pyotp.random_base32()}
        )
        if not created and options["rotate"]:
            admin_user.totp_secret = pyotp.random_base32()
            admin_user.save(update_fields=["totp_secret"])

        totp = pyotp.TOTP(admin_user.totp_secret)
        uri = totp.provisioning_uri(name=username, issuer_name=settings.ADMIN_TOTP_ISSUER)

        raw_codes = AdminBackupCode.generate_set(admin_user)

        self.stdout.write(self.style.SUCCESS(f"Admin user: {username} ({'created' if created else 'existing'})"))
        self.stdout.write(f"TOTP secret: {admin_user.totp_secret}")
        self.stdout.write(f"Provisioning URI (scan or paste into an authenticator app):\n{uri}")
        self.stdout.write(self.style.WARNING("\nBackup codes (shown once — store securely, each works once):"))
        for code in raw_codes:
            self.stdout.write(f"  {code}")
