from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import OrganizationViewSet, MembershipViewSet, me

router = DefaultRouter()
router.register("", OrganizationViewSet, basename="organization")
router.register("memberships", MembershipViewSet, basename="membership")

urlpatterns = [
    path("me/", me, name="me"),
] + router.urls
