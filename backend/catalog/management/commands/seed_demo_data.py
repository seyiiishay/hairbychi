from django.core.management.base import BaseCommand

from catalog.models import Category, Service
from availability.models import AvailabilityRecurring


class Command(BaseCommand):
    help = "Seeds demo categories, services, and a Tue-Sat 9-5 weekly schedule for local dev / staging."

    def handle(self, *args, **options):
        if Category.objects.exists():
            self.stdout.write("Categories already exist — skipping catalog seed.")
        else:
            braids = Category.objects.create(name="Braids", display_order=1)
            Service.objects.create(
                category=braids, name="Box Braids (Small)", price=180, duration_minutes=240, display_order=1
            )
            Service.objects.create(
                category=braids, name="Box Braids (Medium)", price=140, duration_minutes=180, display_order=2
            )
            Service.objects.create(
                category=braids, name="Knotless Braids", price=200, duration_minutes=270, display_order=3
            )

            twists = Category.objects.create(name="Twists", display_order=2)
            Service.objects.create(
                category=twists, name="Passion Twists", price=160, duration_minutes=210, display_order=1
            )
            Service.objects.create(
                category=twists, name="Marley Twists", price=150, duration_minutes=180, display_order=2
            )

            styling = Category.objects.create(name="Styling & Extras", display_order=3)
            Service.objects.create(
                category=styling, name="Hair Wash & Blow-dry", price=35, duration_minutes=45, display_order=1
            )
            Service.objects.create(
                category=styling, name="Edge Styling / Touch-up", price=15, duration_minutes=20, display_order=2
            )
            self.stdout.write(self.style.SUCCESS("Seeded categories & services."))

        if AvailabilityRecurring.objects.exists():
            self.stdout.write("Recurring availability already exists — skipping.")
        else:
            # Tuesday(1) - Saturday(5), 9am-5pm local time. Monday(0)/Sunday(6) off.
            for weekday in [1, 2, 3, 4, 5]:
                AvailabilityRecurring.objects.create(weekday=weekday, start_time="09:00", end_time="17:00")
            self.stdout.write(self.style.SUCCESS("Seeded Tue-Sat 9am-5pm weekly availability."))
