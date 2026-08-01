from django.contrib import admin
from common.admin import AuditableAdminMixin
from .models import (
    Property, PropertyDocument, Building, BuildingDocument,
    Floor, Unit, UnitDocument,
)


class PropertyDocumentInline(admin.TabularInline):
    model = PropertyDocument
    extra = 0
    readonly_fields = ("created_by", "updated_by", "created_at", "updated_at")


@admin.register(Property)
class PropertyAdmin(AuditableAdminMixin, admin.ModelAdmin):
    list_display = ("name", "code", "organization", "property_type", "status", "city")
    list_filter = ("organization", "property_type", "status")
    search_fields = ("name", "code")
    inlines = [PropertyDocumentInline]


class BuildingDocumentInline(admin.TabularInline):
    model = BuildingDocument
    extra = 0
    readonly_fields = ("created_by", "updated_by", "created_at", "updated_at")


@admin.register(Building)
class BuildingAdmin(AuditableAdminMixin, admin.ModelAdmin):
    list_display = ("name", "code", "property", "organization", "building_type", "status", "number_of_floors")
    list_filter = ("organization", "property", "status", "building_type")
    search_fields = ("name", "code")
    inlines = [BuildingDocumentInline]


@admin.register(Floor)
class FloorAdmin(AuditableAdminMixin, admin.ModelAdmin):
    list_display = ("name", "code", "building", "floor_number", "floor_type", "status")
    list_filter = ("organization", "building", "status", "floor_type")
    search_fields = ("name", "code")


class UnitDocumentInline(admin.TabularInline):
    model = UnitDocument
    extra = 0
    readonly_fields = ("created_by", "updated_by", "created_at", "updated_at")


@admin.register(Unit)
class UnitAdmin(AuditableAdminMixin, admin.ModelAdmin):
    list_display = ("unit_number", "unit_name", "floor", "unit_type", "status", "monthly_rent")
    list_filter = ("organization", "status", "unit_type", "unit_category")
    search_fields = ("unit_number", "unit_name")
    inlines = [UnitDocumentInline]
