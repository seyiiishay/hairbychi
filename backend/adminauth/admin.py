from django.contrib import admin

from .models import AdminUser, AdminBackupCode, AdminSession

admin.site.register(AdminUser)
admin.site.register(AdminBackupCode)
admin.site.register(AdminSession)
