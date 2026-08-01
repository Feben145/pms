from django.contrib import admin
from common.admin import AuditableAdminMixin
from .models import Tenant, TenantDocument


class TenantDocumentInline(admin.TabularInline):
    model = TenantDocument
    extra = 0
    readonly_fields = ("created_by", "updated_by", "created_at", "updated_at")


@admin.register(Tenant)
class TenantAdmin(AuditableAdminMixin, admin.ModelAdmin):
    list_display = ("full_name", "tenant_code", "tenant_type", "status", "phone_number", "kyc_verified")
    list_filter = ("organization", "status", "tenant_type", "kyc_verified", "blacklist_status")
    search_fields = ("full_name", "tenant_code", "phone_number", "email", "company_name")
    inlines = [TenantDocumentInline]
