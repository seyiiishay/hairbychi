import uuid

from django.conf import settings
from django.core.files.storage import default_storage
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from adminauth.permissions import IsAdminSession
from . import stripe_service


class SetupIntentView(APIView):
    """POST /api/payments/setup-intent — backs Stripe Elements card capture
    for the online payment path (PM-01). Returns a client_secret to confirm
    against in the browser; no charge happens here."""

    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]

    def post(self, request):
        data = stripe_service.create_setup_intent()
        return Response(data)


class AdminProofUploadView(APIView):
    """POST /api/admin/uploads/proof — multipart 'file'. Returns a proof_url
    to pass into the approve endpoint's { proof_url, proof_note } body
    (PM-05)."""

    permission_classes = [IsAdminSession]
    parser_classes = [MultiPartParser]

    def post(self, request):
        upload = request.FILES.get("file")
        if not upload:
            return Response(
                {"error": {"code": "validation_error", "message": "No file provided."}}, status=400
            )
        ext = upload.name.rsplit(".", 1)[-1] if "." in upload.name else "bin"
        path = f"proof_of_payment/{uuid.uuid4()}.{ext}"
        saved_path = default_storage.save(path, upload)
        url = default_storage.url(saved_path)
        if url.startswith("/"):
            url = settings.PUBLIC_API_BASE_URL.rstrip("/") + url if getattr(
                settings, "PUBLIC_API_BASE_URL", None
            ) else url
        return Response({"proof_url": url}, status=201)
