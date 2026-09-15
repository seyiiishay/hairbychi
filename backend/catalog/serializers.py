from rest_framework import serializers

from .models import Category, Service


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = [
            "id",
            "category",
            "name",
            "description",
            "photo_url",
            "price",
            "duration_minutes",
            "display_order",
            "is_active",
        ]


class ServiceNestedSerializer(serializers.ModelSerializer):
    """Nested under a category for the public browse endpoint (BK-01).
    Not separately paginated — only the category list is paginated."""

    class Meta:
        model = Service
        fields = ["id", "name", "description", "photo_url", "price", "duration_minutes"]


class CategoryPublicSerializer(serializers.ModelSerializer):
    services = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "display_order", "services"]

    def get_services(self, obj):
        active_services = [s for s in obj.services.all() if s.is_active]
        return ServiceNestedSerializer(active_services, many=True).data


class CategoryAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "display_order", "is_active"]
