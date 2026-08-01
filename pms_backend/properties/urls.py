from rest_framework.routers import DefaultRouter
from .views import (
    PropertyViewSet, PropertyDocumentViewSet,
    BuildingViewSet, BuildingDocumentViewSet,
    FloorViewSet, UnitViewSet, UnitDocumentViewSet,
)

router = DefaultRouter()
router.register("buildings/documents", BuildingDocumentViewSet, basename="building-document")
router.register("buildings", BuildingViewSet, basename="building")
router.register("floors", FloorViewSet, basename="floor")
router.register("units/documents", UnitDocumentViewSet, basename="unit-document")
router.register("units", UnitViewSet, basename="unit")
router.register("documents", PropertyDocumentViewSet, basename="property-document")
router.register("", PropertyViewSet, basename="property")

urlpatterns = router.urls
