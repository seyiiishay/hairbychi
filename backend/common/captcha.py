import logging

import requests
from django.conf import settings

from .errors import CaptchaFailed

logger = logging.getLogger("api.captcha")


def verify_captcha(token, remote_ip=None):
    """
    Verifies a CAPTCHA token against hCaptcha or Cloudflare Turnstile
    (both share the same verify-endpoint request/response shape).
    Raises CaptchaFailed on any failure. No-ops in local dev when
    CAPTCHA_BYPASS is set.
    """
    if settings.CAPTCHA_BYPASS:
        return True

    if not token:
        raise CaptchaFailed()

    payload = {"secret": settings.CAPTCHA_SECRET_KEY, "response": token}
    if remote_ip:
        payload["remoteip"] = remote_ip

    try:
        resp = requests.post(settings.CAPTCHA_VERIFY_URL, data=payload, timeout=5)
        data = resp.json()
    except (requests.RequestException, ValueError):
        logger.exception("CAPTCHA verification request failed")
        raise CaptchaFailed()

    if not data.get("success"):
        raise CaptchaFailed()

    return True
