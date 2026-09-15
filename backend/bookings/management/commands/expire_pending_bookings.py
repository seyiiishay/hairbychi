from django.core.management.base import BaseCommand

from bookings.services import expire_stale_pending_bookings


class Command(BaseCommand):
    help = (
        "Expires pending bookings whose requested_start_time has passed "
        "(PRD Section 3). Schedule this on Railway (or any cron) to run "
        "every few minutes."
    )

    def handle(self, *args, **options):
        count = expire_stale_pending_bookings()
        self.stdout.write(self.style.SUCCESS(f"Expired {count} stale pending booking(s)."))
