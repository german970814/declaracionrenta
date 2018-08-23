from rest_framework import serializers

from . import models
from .mixins import FlexFieldsModelSerializer, PrimaryKeyRelatedFieldGraphQl


class CondicionSerializer(serializers.ModelSerializer):
    """Serializer de condiciones"""
    class Meta:
        model = models.Condicion
        fields = (
            'id', 'izquierda', 'derecha',
            'tipo_izquierda', 'tipo_derecha',
            'orden', 'unidad_izquierda',
            'unidad_derecha', 'valor_si', 'valor_no',
        )
        extra_kwargs = {
            'valor_si': {'required': False},
            'valor_no': {'required': False}
        }


class ConjuntoSerializer(FlexFieldsModelSerializer):
    """Serializer de conjuntos"""
    parent = PrimaryKeyRelatedFieldGraphQl(
        queryset=models.Conjunto.objects.all(), required=False)

    class Meta:
        model = models.Conjunto
        fields = (
            'id', 'parent', 'descripcion',
            'nombre', 'identificador', 'repetible',
            'requisitos', 'automatico', 'children_set',
            'campos', 'condiciones_set'
        )
        extra_kwargs = {
            'children_set': {'required': False},
            'condiciones_set': {'required': False},
            'campos': {'required': False},
            'parent': {'required': False}
        }

    expandable_fields = {
        'parent': ('main.ConjuntoSerializer', {'source': 'parent'}),
        'campos': ('main.CampoSerializer', {
            'source': 'campos', 'many': True, 'required': False
        }),
        'children_set': ('main.ConjuntoSerializer', {
            'source': 'children_set', 'many': True,
            'expand': 'children_set'
        }),
        'condiciones_set': ('main.CondicionSerializer', {
            'source': 'condiciones_set', 'many': True,
            'required': False
        })
    }


class CampoSerializer(FlexFieldsModelSerializer):
    """Serializer de campos"""
    class Meta:
        model = models.Campo
        fields = (
            'id', 'nombre', 'numerico', 'descripcion',
            'orden', 'valor_texto', 'valor_numerico',
            'identificador', 'conjunto', 'automatico'
        )
        extra_kwargs = {
            'conjunto': {'required': False}
        }

    expandable_fields = {
        'conjunto': ('main.ConjuntoSerializer', {'source': 'conjunto'})
    }

    def update(self, instance, validated_data):
        instance.update(**validated_data)
        return instance


class Declaracion(serializers.ModelSerializer):
    """Serializer de la declaración de renta"""
    class Meta:
        model = models.Declaracion
        fields = ('id', 'formato')
