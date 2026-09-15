from django.contrib import admin

from .models import AvailabilityRecurring, AvailabilityBlock

admin.site.register(AvailabilityRecurring)
admin.site.register(AvailabilityBlock)
