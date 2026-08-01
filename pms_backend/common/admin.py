"""
Shared admin behavior for audit fields.

Every model inherits `created_by` / `updated_by` / `created_at` /
`updated_at` from `common.models.TimeStampedModel`, meant to be set
automatically by the system -- never picked by hand from a dropdown.
Django's default ModelAdmin doesn't know that intent on its own; every
ModelAdmin for an audited model should inherit this mixin so the
fields are (a) read-only in the form and (b) actually populated from
the logged-in admin user, instead of silently staying blank or being
set to the wrong person by accident.
"""


class AuditableAdminMixin:
    readonly_fields = ("created_by", "updated_by", "created_at", "updated_at")

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)
