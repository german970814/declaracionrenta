from django.contrib import admin
from django.conf import settings

from . import models


admin.site.register(models.Usuario)
admin.site.register(models.Declaracion)
admin.site.register(models.Condicion)

if settings.DEBUG:
    admin.site.register(models.Campo)
    admin.site.register(models.Conjunto)
