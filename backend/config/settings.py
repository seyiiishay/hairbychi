"""
Django settings for BraidsByChi booking platform.

Env-driven so the same codebase runs in staging and production
(see docs/08-env-template.md in the frontend guide for the full list).
"""

import os
from datetime import timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


def env_bool(name, default=False):
    val = os.environ.get(name)
    if val is None:
        return default
    return val.strip().lower() in ("1", "true", "yes", "on")


def env_list(name, default=""):
    val = os.environ.get(name, default)
    return [item.strip() for item in val.split(",") if item.strip()]


SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "insecure-dev-key-change-me")
DEBUG = env_bool("DJANGO_DEBUG", True)
APP_ENV = os.environ.get("APP_ENV", "development")  # development | staging | production

ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "*")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "common",
    "catalog",
    "clients",
    "bookings",
    "availability",
    "adminauth",
    "payments",
    "notifications",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

# API paths in the contract have no trailing slash (e.g. /api/categories).
# Avoid Django's redirect-on-slash-mismatch, which would break POST bodies.
APPEND_SLASH = False

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
# Railway provides DATABASE_URL for Postgres. Falls back to sqlite for local dev.
DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL:
    import dj_database_url  # noqa: E402

    DATABASES = {"default": dj_database_url.parse(DATABASE_URL, conn_max_age=600)}
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"

# All timestamps are stored and transmitted in UTC. Display conversion to
# America/Regina (CST, no DST) happens in the frontend and in outgoing emails.
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# The single timezone the business operates in (Section 5, PRD).
DISPLAY_TIMEZONE = "America/Regina"

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS", "http://localhost:5173")
CORS_ALLOW_CREDENTIALS = True

# ---------------------------------------------------------------------------
# DRF
# ---------------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_PAGINATION_CLASS": "common.pagination.StandardPageNumberPagination",
    "PAGE_SIZE": 20,
    "EXCEPTION_HANDLER": "common.exceptions.api_exception_handler",
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.MultiPartParser",
        "rest_framework.parsers.FormParser",
    ],
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": os.environ.get("PUBLIC_API_RATE_LIMIT", "60/min"),
        "admin_login": os.environ.get("ADMIN_LOGIN_RATE_LIMIT", "10/min"),
    },
}

# ---------------------------------------------------------------------------
# Business rules (ENV constants — not stylist-editable, per PRD Section 6.1 & 5)
# ---------------------------------------------------------------------------
BUFFER_MINUTES = int(os.environ.get("BUFFER_MINUTES", 30))

# ⚠️ OPEN in PRD Section 6.1 — exact threshold not yet decided by the client.
# Defaulted here to $75.00 CAD so the deposit engine is functional; change via
# env without a code deploy once the real number is confirmed.
DEPOSIT_THRESHOLD_AMOUNT = os.environ.get("DEPOSIT_THRESHOLD_AMOUNT", "75.00")
DEPOSIT_AMOUNT_SINGLE_SERVICE = os.environ.get("DEPOSIT_AMOUNT_SINGLE_SERVICE", "20.00")
DEPOSIT_AMOUNT_MULTI_SERVICE = os.environ.get("DEPOSIT_AMOUNT_MULTI_SERVICE", "30.00")

# Strike system thresholds (Section 8.1)
STRIKE_HIGH_RISK_COUNT = int(os.environ.get("STRIKE_HIGH_RISK_COUNT", 2))

# Late arrival grace period (Section 8.3)
LATE_ARRIVAL_GRACE_MINUTES = int(os.environ.get("LATE_ARRIVAL_GRACE_MINUTES", 15))

# Cancellation / reschedule cutoff (Section 8.4)
CLIENT_ACTION_CUTOFF_HOURS = int(os.environ.get("CLIENT_ACTION_CUTOFF_HOURS", 24))

# ⚠️ OPEN in PRD Section 9 — admin session timeout not yet decided.
# Defaulted to 60 minutes of inactivity-free absolute lifetime; revisit.
ADMIN_SESSION_TIMEOUT_MINUTES = int(os.environ.get("ADMIN_SESSION_TIMEOUT_MINUTES", 60))
ADMIN_SESSION_LIFETIME = timedelta(minutes=ADMIN_SESSION_TIMEOUT_MINUTES)

# ---------------------------------------------------------------------------
# Stripe
# ---------------------------------------------------------------------------
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_PUBLISHABLE_KEY = os.environ.get("STRIPE_PUBLISHABLE_KEY", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")

# ---------------------------------------------------------------------------
# CAPTCHA (hCaptcha or Cloudflare Turnstile — same verify-endpoint shape)
# ---------------------------------------------------------------------------
CAPTCHA_PROVIDER = os.environ.get("CAPTCHA_PROVIDER", "hcaptcha")  # hcaptcha | turnstile
CAPTCHA_SECRET_KEY = os.environ.get("CAPTCHA_SECRET_KEY", "")
CAPTCHA_VERIFY_URL = os.environ.get(
    "CAPTCHA_VERIFY_URL",
    "https://hcaptcha.com/siteverify"
    if CAPTCHA_PROVIDER == "hcaptcha"
    else "https://challenges.cloudflare.com/turnstile/v0/siteverify",
)
# Set to skip real verification in local/dev environments.
CAPTCHA_BYPASS = env_bool("CAPTCHA_BYPASS", DEBUG)

# ---------------------------------------------------------------------------
# Resend (transactional email)
# ---------------------------------------------------------------------------
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
NOTIFICATIONS_FROM_EMAIL = os.environ.get("NOTIFICATIONS_FROM_EMAIL", "bookings@braidsbychi.app.ekanets.com")
# When no RESEND_API_KEY is configured, emails are logged instead of sent —
# safe default for local dev.
NOTIFICATIONS_LOG_ONLY = env_bool("NOTIFICATIONS_LOG_ONLY", not RESEND_API_KEY)

PUBLIC_SITE_URL = os.environ.get("PUBLIC_SITE_URL", "http://localhost:5173")
# Used to turn locally-stored media (e.g. proof-of-payment uploads) into
# absolute URLs in API responses. Set to the Railway API host in deploy envs.
PUBLIC_API_BASE_URL = os.environ.get("PUBLIC_API_BASE_URL", "http://localhost:8000")

# TOTP admin auth
ADMIN_TOTP_ISSUER = os.environ.get("ADMIN_TOTP_ISSUER", "BraidsByChi")
