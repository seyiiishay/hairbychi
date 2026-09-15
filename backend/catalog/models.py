from django.db import models

from common.models import UUIDModel, TimestampedModel


class Category(UUIDModel, TimestampedModel):
    name = models.CharField(max_length=120)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["display_order", "name"]
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name


class Service(UUIDModel, TimestampedModel):
    category = models.ForeignKey(Category, related_name="services", on_delete=models.CASCADE)
    name = models.CharField(max_length=160)
    description = models.TextField(blank=True, default="")
    photo_url = models.URLField(blank=True, default="")
    price = models.DecimalField(max_digits=8, decimal_places=2)
    duration_minutes = models.PositiveIntegerField()
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    # No deposit fields here by design — deposit is computed at the booking
    # level (PRD Section 6.1). Do not add deposit_required/deposit_amount here.

    class Meta:
        ordering = ["display_order", "name"]

    def __str__(self):
        return f"{self.name} ({self.category.name})"
