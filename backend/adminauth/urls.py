from django.urls import path

from .views import AdminLoginView, AdminBackupCodeLoginView, AdminLogoutView, AdminSessionCheckView

admin_urlpatterns = [
    path("login", AdminLoginView.as_view(), name="admin-login"),
    path("login/backup-code", AdminBackupCodeLoginView.as_view(), name="admin-login-backup-code"),
    path("logout", AdminLogoutView.as_view(), name="admin-logout"),
    path("session", AdminSessionCheckView.as_view(), name="admin-session"),
]
