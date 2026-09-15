from rest_framework import serializers

from .models import Client


class ClientAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = [
            "id",
            "name",
            "email",
            "phone",
            "strike_count",
            "reschedule_count_lifetime",
            "high_risk_flag",
            "high_risk_cleared_note",
            "created_at",
        ]
