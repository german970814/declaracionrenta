from rest_framework import serializers
from rest_flex_fields import FlexFieldsModelSerializer

from . import models


class CondicionSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Condicion
        fields = (
            'id', 'izquierda', 'derecha',
            'condiciones', 'orden', 'uvt',
            'valor_si', 'valor_no', 'tipo',
        )


class ConjuntoSerializer(FlexFieldsModelSerializer):
    class Meta:
        model = models.Conjunto
        fields = (
            'id', 'parent', 'descripcion',
            'nombre', 'identificador', 'repetible'
        )

    expandable_fields = {
        'parent': (ConjuntoSerializer, {'source': 'conjunto'})
    }


class CampoSerializer(FlexFieldsModelSerializer):
    class Meta:
        model = models.Campo
        fields = (
            'id', 'nombre', 'numerico', 'descripcion',
            'orden', 'valor_texto', 'valor_numerico',
            'identificador', 'conjunto',
        )

    expandable_fields = {
        'conjunto': (ConjuntoSerializer, {'source': 'conjunto'})
    }


class Declaracion(serializers.ModelSerializer):
    class Meta:
        model = models.Declaracion
        fields = ('id', 'formato')
