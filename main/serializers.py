from rest_framework import serializers

from django.db import transaction

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
            'requisitos', 'automatico', 'children_set',
            'campos',
        )
        extra_kwargs = {
            'children_set': {'required': False},
            'campos': {'required': False},
            'parent': {'required': False}
        }

    expandable_fields = {
        'parent': ('main.ConjuntoSerializer', {'source': 'parent'}),
        'campos': ('main.CampoSerializer', {
            'source': 'campos', 'many': True
        }),
        'children_set': ('main.ConjuntoSerializer', {
            'source': 'children_set', 'many': True,
            'expand': 'children_set'
        })
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # print(kwargs)

    def update(self, instance, validated_data):
        pop_data = ['campos', 'parent', 'children_set']
        with transaction.atomic():
            kwargs = {}
            default_data_kwargs = {'conjunto': instance}
            campos = []
            data_campos = self.data.pop('campos')
            for index, campo in enumerate(data_campos):
                campo_instance = None
                if 'id' in campo:
                    campo_instance = models.Campo.objects.get(id=campo.get('id'))
                campo_serializer = CampoSerializer(
                    instance=campo_instance, data=validated_data['campos'][index])
                campo_serializer.is_valid()
                campos.append(campo_serializer.save())
            for field in validated_data:
                if field in pop_data and field in self.expanded_fields:
                    continue
                kwargs[field] = validated_data[field]
            instance.campos.set(campos)
            instance.update(**kwargs)
        return instance


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
