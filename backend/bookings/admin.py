from django.contrib import admin

from .models import Booking, BookingItem


class BookingItemInline(admin.TabularInline):
    model = BookingItem
    extra = 0


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ["id", "client", "status", "requested_start_time", "payment_method"]
    list_filter = ["status", "payment_method", "archived"]
    inlines = [BookingItemInline]
