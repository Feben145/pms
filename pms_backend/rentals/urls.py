from rest_framework.routers import DefaultRouter

from .views import (
    RentalAccountViewSet,
    InvoiceViewSet,
    PaymentViewSet,
    RentalAdjustmentViewSet,
    DepositViewSet,
)

router = DefaultRouter()

router.register("payments", PaymentViewSet, basename="payment")
router.register("adjustments", RentalAdjustmentViewSet, basename="rental-adjustment")
router.register("deposits", DepositViewSet, basename="deposit")
router.register("invoices", InvoiceViewSet, basename="invoice")
router.register("", RentalAccountViewSet, basename="rental-account")

urlpatterns = router.urls
