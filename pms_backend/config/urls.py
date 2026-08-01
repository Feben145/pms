"""
Root URL configuration.

API endpoints are namespaced per app under /api/v1/, matching the app
boundaries described in docs/ARCHITECTURE.md. Auto-generated OpenAPI
docs live at /api/docs/ so the contract is always current -- no
hand-maintained API reference to fall out of sync.
"""

from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),

    # Auth
    path("api/v1/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/v1/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Domain APIs -- one include per app/module
    path("api/v1/organizations/", include("organizations.urls")),
    path("api/v1/properties/", include("properties.urls")),
    path("api/v1/tenants/", include("tenants.urls")),
    path("api/v1/leases/", include("leases.urls")),
    path("api/v1/rentals/", include("rentals.urls")),

    # API schema & docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
