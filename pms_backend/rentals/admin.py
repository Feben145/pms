from django.contrib import admin
from common.admin import AuditableAdminMixin
from .models import Invoice, Payment


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    readonly_fields = ("created_by", "updated_by", "created_at", "updated_at")


@admin.register(Invoice)
class InvoiceAdmin(AuditableAdminMixin, admin.ModelAdmin):
    list_display = ("invoice_number", "lease", "total_amount", "status", "due_date")
    list_filter = ("organization", "status")
    search_fields = ("invoice_number",)
    inlines = [PaymentInline]


@admin.register(Payment)
class PaymentAdmin(AuditableAdminMixin, admin.ModelAdmin):
    list_display = ("invoice", "amount", "method", "paid_at")
    list_filter = ("organization", "method")
