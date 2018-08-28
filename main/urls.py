from django.urls import path
from django.conf import settings

from . import views


urlpatterns = [
    path('{}/condiciones/<pk>/'.format(settings.API_URL_PREFIX), views.create_condicional),
]
