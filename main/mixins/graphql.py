from graphene.types import Field, InputField
from graphene.types.objecttype import yank_fields_from_attrs

from rest_framework.relations import PrimaryKeyRelatedField

from graphene_django.rest_framework.mutation import SerializerMutation, SerializerMutationOptions

from graphql_relay import from_global_id, to_global_id

from ..utils import fields_for_serializer


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


class PrimaryKeyRelatedFieldGraphQl(PrimaryKeyRelatedField):
    """Soporte para PrimaryKeyRelatedField con graphQl"""

    def to_internal_value(self, data):
        if isinstance(data, str):
            _, data = from_global_id(data)
        return super().to_internal_value(data)
