"""
URL layout:

  /api/<public endpoints>            — catalog, availability/slots, bookings, payments/setup-intent
  /api/admin/<admin endpoints>        — everything requiring a session_token
  /api/webhooks/<provider>            — backend-to-backend only
  /admin/                             — Django's built-in admin (staff superuser, separate from AU-02 TOTP admin)
"""
from django.contrib import admin as django_admin
from django.urls import path, include

import catalog.urls
import bookings.urls
import availability.urls
import adminauth.urls
import payments.urls
import clients.urls

public_urlpatterns = (
    catalog.urls.public_urlpatterns
    + bookings.urls.public_urlpatterns
    + availability.urls.public_urlpatterns
    + payments.urls.public_urlpatterns
)

admin_urlpatterns = (
    adminauth.urls.admin_urlpatterns
    + catalog.urls.admin_urlpatterns
    + bookings.urls.admin_urlpatterns
    + availability.urls.admin_urlpatterns
    + payments.urls.admin_urlpatterns
    + clients.urls.admin_urlpatterns
)

urlpatterns = [
    path("django-admin/", django_admin.site.urls),
    path("api/", include(public_urlpatterns)),
    path("api/admin/", include(admin_urlpatterns)),
    path("api/", include(payments.urls.webhook_urlpatterns)),
]
