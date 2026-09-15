from django.db import models

from common.models import UUIDModel, TimestampedModel


class Client(UUIDModel, TimestampedModel):
    """
    Guest-only — no auth account. Repeat-client / strike matching uses
    EITHER phone OR email (PRD Section 6.2), so a single person can end up
    with multiple Client rows if they vary contact details; matching happens
    at booking-creation time via `find_matching_clients`.
    """

    name = models.CharField(max_length=160)
    email = models.EmailField()
    phone = models.CharField(max_length=32)

    strike_count = models.PositiveIntegerField(default=0)
    reschedule_count_lifetime = models.PositiveIntegerField(default=0)
    high_risk_flag = models.BooleanField(default=False)
    high_risk_cleared_note = models.TextField(blank=True, default="")

    class Meta:
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["phone"]),
        ]

    def __str__(self):
        return f"{self.name} <{self.email}>"

    @classmethod
    def find_matching(cls, email, phone):
        """Any prior Client row matching this email OR phone (Section 6.2)."""
        return cls.objects.filter(models.Q(email__iexact=email) | models.Q(phone=phone))

    @property
    def is_returning_risk_relevant(self):
        return self.strike_count >= 1
