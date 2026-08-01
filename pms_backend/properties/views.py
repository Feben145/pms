from rest_framework import viewsets, permissions, parsers
from django_filters.rest_framework import DjangoFilterBackend

from common.mixins import OrgScopedViewSetMixin
from .models import Property, PropertyDocument, Building, BuildingDocument, Floor, Unit, UnitDocument
from .serializers import (
    PropertySerializer, PropertyDocumentSerializer,
    BuildingSerializer, BuildingDocumentSerializer,
    FloorSerializer, UnitSerializer, UnitDocumentSerializer,
)


class PropertyViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Property.objects.all()
    serializer_class = PropertySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status", "property_type", "city"]
    # MultiPartParser is required to accept the property image upload
    # alongside regular form fields in the same request.
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]


class PropertyDocumentViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = PropertyDocument.objects.all()
    serializer_class = PropertyDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["property"]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]


class BuildingViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Building.objects.all()
    serializer_class = BuildingSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["property", "status", "building_type"]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]


class BuildingDocumentViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = BuildingDocument.objects.all()
    serializer_class = BuildingDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["building"]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]


class FloorViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Floor.objects.all()
    serializer_class = FloorSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["building", "status", "floor_type"]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]


class UnitViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["floor", "status", "unit_type"]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]


class UnitDocumentViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = UnitDocument.objects.all()
    serializer_class = UnitDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["unit"]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
