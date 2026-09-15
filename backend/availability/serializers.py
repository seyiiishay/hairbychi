from rest_framework import serializers

from .models import AvailabilityRecurring, AvailabilityBlock


class AvailabilityRecurringSerializer(serializers.ModelSerializer):
    class Meta:
        model = AvailabilityRecurring
        fields = ["id", "weekday", "start_time", "end_time", "is_active"]

    def validate(self, attrs):
        start = attrs.get("start_time", getattr(self.instance, "start_time", None))
        end = attrs.get("end_time", getattr(self.instance, "end_time", None))
        if start and end and start >= end:
            raise serializers.ValidationError("end_time must be after start_time")
        return attrs


class AvailabilityRecurringBulkDaySerializer(serializers.Serializer):
    """One weekday's list of windows for the bulk-replace endpoint."""

    weekday = serializers.IntegerField(min_value=0, max_value=6)
    windows = serializers.ListField(child=serializers.DictField(), allow_empty=True)


class AvailabilityBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = AvailabilityBlock
        fields = ["id", "date", "reason", "created_at"]


class SlotsRequestSerializer(serializers.Serializer):
    date_from = serializers.DateField()
    date_to = serializers.DateField()
    required_duration_minutes = serializers.IntegerField(min_value=1)

    def validate(self, attrs):
        if attrs["date_to"] < attrs["date_from"]:
            raise serializers.ValidationError("date_to must be on or after date_from")
        return attrs
