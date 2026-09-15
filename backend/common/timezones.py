"""
Helpers around the single business timezone (America/Regina — CST, no DST).

Everything is stored and transmitted in UTC; these helpers exist for
server-side rendering of human copy (emails) only. The frontend does its own
display conversion.
"""
from zoneinfo import ZoneInfo

from django.conf import settings

DISPLAY_TZ = ZoneInfo(settings.DISPLAY_TIMEZONE)


def to_display(dt):
    """Convert an aware UTC datetime to the business display timezone."""
    if dt is None:
        return None
    return dt.astimezone(DISPLAY_TZ)


def format_display(dt, fmt="%A, %B %-d, %Y at %-I:%M %p"):
    local = to_display(dt)
    if local is None:
        return ""
    return local.strftime(fmt) + " CST"
