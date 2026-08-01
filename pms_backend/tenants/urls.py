from rest_framework.routers import DefaultRouter
from .views import TenantViewSet, TenantDocumentViewSet

router = DefaultRouter()
router.register("documents", TenantDocumentViewSet, basename="tenant-document")
router.register("", TenantViewSet, basename="tenant")

urlpatterns = router.urls
