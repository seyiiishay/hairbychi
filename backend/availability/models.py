from django.db import models

from common.models import TimestampedModel

WEEKDAY_CHOICES = [
    (0, "Monday"),
    (1, "Tuesday"),
    (2, "Wednesday"),
    (3, "Thursday"),
    (4, "Friday"),
    (5, "Saturday"),
    (6, "Sunday"),
]


class AvailabilityRecurring(TimestampedModel):
    """
    Base weekly schedule (AV-01). weekday follows Python's date.weekday()
    convention: 0 = Monday ... 6 = Sunday (matches the API contract — the
    FRONTEND is responsible for reconciling calendar libraries that default
    to Sunday = 0).

    start_time/end_time are local wall-clock times in the business timezone
    (America/Regina). Multiple rows per weekday are allowed (split shifts).
    """

    weekday = models.IntegerField(choices=WEEKDAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["weekday", "start_time"]

    def __str__(self):
        return f"{self.get_weekday_display()} {self.start_time}-{self.end_time}"


class AvailabilityBlock(TimestampedModel):
    """A fully blocked-off day (AV-02). Whole-day only — the contract does
    not define partial-day blocking."""

    date = models.DateField(unique=True)
    reason = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return f"Blocked {self.date}"
