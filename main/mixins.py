from django.utils.module_loading import import_string

from rest_flex_fields import FlexFieldsModelSerializer as FlexFieldSerializer

from graphene.types import Field, InputField
from graphene.types.objecttype import yank_fields_from_attrs
from graphene_django.rest_framework.mutation import SerializerMutation, SerializerMutationOptions

from graphql_relay import from_global_id, to_global_id

from .utils import fields_for_serializer

import copy


class SerializableMixin:
    """Mixin para obtener el serializer desde la clase modelo."""
    @classmethod
    def get_serializer_class(cls):
        """Singleton para retornar el serializer de la clase"""
        serializer_class = getattr(cls, '_serializer_class', None)
        if not serializer_class and hasattr(cls, 'SERIALIZER_CLASS'):
            cls._serializer_class = serializer_class = import_string(cls.SERIALIZER_CLASS)
        return serializer_class
    
    @classmethod
    def get_schema_class(cls):
        """Singleton para retornar el schema de la clase"""
        schema_class = getattr(cls, '_schema_class', None)
        if not schema_class and hasattr(cls, 'SCHEMA_CLASS'):
            cls._schema_class = schema_class = import_string(cls.SCHEMA_CLASS)
        if schema_class is None:
            raise Exception('"{}" class must be have defined `SCHEMA_CLASS` property'.format(
                cls.__name__
            ))
        return schema_class

    def update(self, force_save=True, **data):
        fields = [x for x in data]
        for field in fields:
            setattr(self, field, data[field])
        if force_save:
            self.save(update_fields=fields)
        return self


class ModelSerializerObjectType(object):
    """
    Mixin que sobreescribe metodos para trabajar con los serializers
    desde graphql
    """
    @classmethod
    def __init_subclass_with_meta__(
        cls,
        lookup_field=None,
        serializer_class=None,
        model_class=None,
        model_operations=["create", "update"],
        only_fields=(),
        exclude_fields=(),
        **options
    ):

        if not serializer_class:
            raise Exception("serializer_class is required for the SerializerMutation")

        if "update" not in model_operations and "create" not in model_operations:
            raise Exception('model_operations must contain "create" and/or "update"')

        initial_kwargs = cls.get_initial_serializer_kwargs()
        serializer = serializer_class(**initial_kwargs)

        if model_class is None:
            serializer_meta = getattr(serializer_class, "Meta", None)
            if serializer_meta:
                model_class = getattr(serializer_meta, "model", None)

        if lookup_field is None and model_class:
            lookup_field = model_class._meta.pk.name

        input_fields = fields_for_serializer(
            serializer, only_fields, exclude_fields, is_input=True
        )
        output_fields = fields_for_serializer(
            serializer, only_fields, exclude_fields, is_input=False
        )

        _meta = SerializerMutationOptions(cls)
        _meta.lookup_field = lookup_field
        _meta.model_operations = model_operations
        _meta.serializer_class = serializer_class
        _meta.model_class = model_class
        _meta.fields = yank_fields_from_attrs(output_fields, _as=Field)

        input_fields = yank_fields_from_attrs(input_fields, _as=InputField)
        super(SerializerMutation, cls).__init_subclass_with_meta__(
            _meta=_meta, input_fields=input_fields, **options
        )

    @classmethod
    def get_initial_serializer_kwargs(cls):
        """Da los parámetros iniciales al serializer cuando se cargara"""
        return {}

    @classmethod
    def get_serializer_kwargs(cls, root, info, **input):
        lookup_field = getattr(cls._meta, 'lookup_field', 'id')
        if lookup_field in input:
            value = input.get(lookup_field, None)
            if lookup_field == 'id' and value is not None:
                type, value = from_global_id(value)
            instance = cls._meta.serializer_class.Meta.model.objects.filter(
                **{lookup_field: value}).first()
            if instance:
                return {'instance': instance, 'data': input, 'partial': True}
            raise django.http.Http404
        return {'data': input, 'partial': True}

    @classmethod
    def perform_mutate(cls, serializer, info):
        instance = serializer.save()

        kwargs = {}
        obj = cls._meta.serializer_class.Meta.model.objects.get(pk=instance.pk)
        for f, field in serializer.__class__().fields.items():
            if f == 'id':
                schema_class = cls._meta.serializer_class.Meta.model.get_schema_class()
                kwargs[f] = to_global_id(schema_class.__name__, field.get_attribute(obj))
                continue
            kwargs[f] = field.get_attribute(obj)

        return cls(errors=None, **kwargs)


class FlexFieldsModelSerializer(FlexFieldSerializer):
    """FlexField para AL_Node"""
    def __init__(self, *args, **kwargs):
        self.depth = kwargs.pop('depth', None)
        super().__init__(*args, **kwargs)

    def _make_expanded_field_serializer(self, name, nested_expands, nested_includes):
        """
        Returns an instance of the dynamically created nested serializer. 
        """
        field_options = self.expandable_fields[name]
        serializer_class = field_options[0]
        serializer_settings = copy.deepcopy(field_options[1])
        depth = (self.depth - 1) if self.depth is not None else None

        if depth:
            serializer_settings['depth'] = depth

        if depth == 0:
            serializer_settings['expand'] = []

        if name in nested_expands:
            if 'expand' in serializer_settings:
                serializer_settings['expand'] += nested_expands[name]
            else:
                serializer_settings['expand'] = nested_expands[name]

        if name in nested_includes:
            serializer_settings['fields'] = nested_includes[name]

        if serializer_settings.get('source') == name:
            del serializer_settings['source']
            
        if type(serializer_class) == str:
            serializer_class = self._import_serializer_class(serializer_class) 
        
        return serializer_class(**serializer_settings)

    def get_normalized_id(self, data={}):
        """Retorna el ID normalizado de acuerdo a la transformación de relay"""
        data = data or self.data
        id = None
        if 'id' in data:
            __, id = from_global_id(data)
        return id
