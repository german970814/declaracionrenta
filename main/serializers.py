from rest_framework import serializers

from django.db import transaction

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
            'source': 'campos', 'many': True, 'required': False
        }),
        'children_set': ('main.ConjuntoSerializer', {
            'source': 'children_set', 'many': True,
            'expand': 'children_set'
        })
    }

    def update(self, instance, validated_data):
        pop_data = ['campos', 'children_set']
        default_kwargs_data = {
            'campos': {
                'conjunto': instance.id if instance else None
            }
        }

        with transaction.atomic():
            kwargs = {}
            for field in pop_data:
                instances = []
                data_field = self.data.get(field)
                validated_data_field = validated_data.get(field)

                if validated_data_field and field in self.expanded_fields:
                    serializer_class = self._import_serializer_class(
                        self.expandable_fields[field][0])
                    model_field = serializer_class.Meta.model

                    for index, data in enumerate(validated_data_field):
                        data_instance = None
                        if (len(data_field) - 1) >= index and 'id' in data_field[index]:
                            data_instance = model_field.objects.get(id=data_field[index].get('id'))
                        elif field in default_kwargs_data:
                            data.update(default_kwargs_data[field])
                        serializer = serializer_class(
                            instance=data_instance, data=data)
                        serializer.is_valid()
                        instances.append(serializer.save())
                    getattr(instance, field).set(instances)

            for field in validated_data:
                if field in pop_data and field in self.expanded_fields:
                    continue
                kwargs[field] = validated_data[field]
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
