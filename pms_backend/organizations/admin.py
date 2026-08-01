from django.contrib import admin
from django.db.models import Count, Sum, Q
from common.admin import AuditableAdminMixin
from .models import Organization, Membership


@admin.register(Organization)
class OrganizationAdmin(AuditableAdminMixin, admin.ModelAdmin):
    """
    This is the platform owner's cross-organization view -- the one
    place internal staff can see a snapshot across every client at
    once. Only ever grant Django admin (is_staff/is_superuser) access
    to internal platform team members; every client's own staff use
    the frontend app instead, where OrgScopedViewSetMixin keeps them
    strictly inside their own organization. See docs/ARCHITECTURE.md
    section 7.
    """

    list_display = (
        "name", "slug", "is_active",
        "property_count", "tenant_count", "active_lease_count", "outstanding_total",
        "created_at",
    )
    search_fields = ("name", "slug")
    list_filter = ("is_active",)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.annotate(
            _property_count=Count("propertys", distinct=True),
            _tenant_count=Count("tenants", distinct=True),
            _active_lease_count=Count(
                "leases", filter=Q(leases__status="active"), distinct=True
            ),
        )

    @admin.display(description="Properties", ordering="_property_count")
    def property_count(self, obj):
        return obj._property_count

    @admin.display(description="Tenants", ordering="_tenant_count")
    def tenant_count(self, obj):
        return obj._tenant_count

    @admin.display(description="Active leases", ordering="_active_lease_count")
    def active_lease_count(self, obj):
        return obj._active_lease_count

    @admin.display(description="Outstanding (ETB)")
    def outstanding_total(self, obj):
        # Computed separately (not in the annotate above) since it needs
        # a different related path (invoices -> lease -> organization)
        # than the direct organization-scoped counts above.
        from rentals.models import Invoice

        total = Invoice.objects.filter(organization=obj).aggregate(
            total=Sum("total_amount")
        )["total"] or 0
        paid = sum(
            inv.amount_paid for inv in Invoice.objects.filter(organization=obj)
        )
        return f"{total - paid:,.2f}"


@admin.register(Membership)
class MembershipAdmin(AuditableAdminMixin, admin.ModelAdmin):
    list_display = ("user", "organization", "role")
    list_filter = ("organization", "role")
