from django.contrib import admin
from common.admin import AuditableAdminMixin
from .models import Lease, LeaseDocument


class LeaseDocumentInline(admin.TabularInline):
    model = LeaseDocument
    extra = 0
    readonly_fields = ("created_by", "updated_by", "created_at", "updated_at")


@admin.register(Lease)
class LeaseAdmin(AuditableAdminMixin, admin.ModelAdmin):
    list_display = ("lease_number", "tenant", "unit", "status", "start_date", "end_date", "monthly_rent")
    list_filter = ("organization", "status", "lease_type")
    search_fields = ("lease_number",)
    inlines = [LeaseDocumentInline]
