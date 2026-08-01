from rest_framework.routers import DefaultRouter
from .views import LeaseViewSet, LeaseDocumentViewSet

router = DefaultRouter()
router.register("documents", LeaseDocumentViewSet, basename="lease-document")
router.register("", LeaseViewSet, basename="lease")

urlpatterns = router.urls
