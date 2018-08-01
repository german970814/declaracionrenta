from rest_framework import serializers

from . import models
from .mixins import FlexFieldsModelSerializer


class CondicionSerializer(serializers.ModelSerializer):
    """Serializer de condiciones"""
    class Meta:
        model = models.Condicion
        fields = (
            'id', 'izquierda', 'derecha',
            'condiciones', 'orden', 'uvt',
            'valor_si', 'valor_no', 'tipo',
        )


class ConjuntoSerializer(FlexFieldsModelSerializer):
    """Serializer de conjuntos"""
    class Meta:
        model = models.Conjunto
        fields = (
            'id', 'parent', 'descripcion',
            'nombre', 'identificador', 'repetible',
            'children_set',
        )

    expandable_fields = {
        'parent': ('main.ConjuntoSerializer', {'source': 'parent'}),
        'children_set': ('main.ConjuntoSerializer', {
            'source': 'children_set', 'many': True, 'expand': 'children_set'
        })
    }


class CampoSerializer(FlexFieldsModelSerializer):
    """Serializer de campos"""
    class Meta:
        model = models.Campo
        fields = (
            'id', 'nombre', 'numerico', 'descripcion',
            'orden', 'valor_texto', 'valor_numerico',
            'identificador', 'conjunto',
        )

    expandable_fields = {
        'conjunto': ('main.ConjuntoSerializer', {'source': 'conjunto'})
    }


class Declaracion(serializers.ModelSerializer):
    """Serializer de la declaración de renta"""
    class Meta:
        model = models.Declaracion
        fields = ('id', 'formato')
