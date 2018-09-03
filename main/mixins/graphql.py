from graphene import Enum
from graphene.relay import Connection, Node
from graphene.types import Field, InputField
from graphene.utils.str_converters import to_camel_case
from graphene.types.objecttype import yank_fields_from_attrs

from rest_framework.relations import PrimaryKeyRelatedField

from graphene_django import DjangoObjectType
from graphene_django.types import DjangoObjectTypeOptions
from graphene_django.rest_framework.mutation import SerializerMutation, SerializerMutationOptions
from graphene_django.utils import DJANGO_FILTER_INSTALLED, get_model_fields, is_valid_django_model
from graphene_django.registry import Registry, get_global_registry
from graphene_django.converter import convert_django_field, get_choices

from graphql_relay import from_global_id, to_global_id

from ..utils import fields_for_serializer

from collections import OrderedDict


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
    def get_expanded_fields(cls, info):
        expanded_fields = []
        serializer = cls._meta.serializer_class

        if hasattr(serializer, 'expandable_fields'):
            params = info.variable_values.get('params', {})

            for field in params:
                if field in serializer.expandable_fields and isinstance(params[field], (dict, tuple)):
                    expanded_fields.append(field)
            return {'expand': expanded_fields}
        return {}

    @classmethod
    def get_serializer_kwargs(cls, root, info, **input):
        lookup_field = getattr(cls._meta, 'lookup_field', 'id')
        kwargs = dict(
            data=input, partial=True,
            **cls.get_expanded_fields(info)
        )

        if lookup_field in input:
            value = input.get(lookup_field, None)
            if lookup_field == 'id' and value is not None:
                type, value = from_global_id(value)
            instance = cls._meta.serializer_class.Meta.model.objects.filter(
                **{lookup_field: value}).first()
            if instance:
                kwargs.update({'instance': instance})
                return kwargs
            raise django.http.Http404
        return kwargs

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


def convert_django_field_with_choices(field, registry=None):
    if registry is not None:
        converted = registry.get_converted_field(field)
        if converted:
            return converted
    choices = getattr(field, "choices", None)
    if choices:
        meta = field.model._meta  # revisar esto
        name = to_camel_case("{}_{}".format(meta.object_name, field.name))
        choices = list([('_vod', '', '',)]) + list(get_choices(choices))
        named_choices = [(c[0], c[1]) for c in choices]
        named_choices_descriptions = {c[0]: c[2] for c in choices}

        class EnumWithDescriptionsType(object):
            @property
            def description(self):
                return named_choices_descriptions[self.name]

        enum = Enum(name, list(named_choices), type=EnumWithDescriptionsType)
        converted = enum(description=field.help_text, required=not field.null and not field.blank)
    else:
        converted = convert_django_field(field, registry)
    if registry is not None:
        registry.register_converted_field(field, converted)
    return converted


def construct_fields(model, registry, only_fields, exclude_fields):
    _model_fields = get_model_fields(model)

    fields = OrderedDict()
    for name, field in _model_fields:
        is_not_in_only = only_fields and name not in only_fields
        # is_already_created = name in options.fields
        is_excluded = name in exclude_fields  # or is_already_created
        # https://docs.djangoproject.com/en/1.10/ref/models/fields/#django.db.models.ForeignKey.related_query_name
        is_no_backref = str(name).endswith("+")
        if is_not_in_only or is_excluded or is_no_backref:
            # We skip this field if we specify only_fields and is not
            # in there. Or when we exclude this field in exclude_fields.
            # Or when there is no back reference.
            continue
        converted = convert_django_field_with_choices(field, registry)
        fields[name] = converted

    return fields


class SupportDjangoObjectType(object):
    @classmethod
    def __init_subclass_with_meta__(
        cls,
        model=None,
        registry=None,
        skip_registry=False,
        only_fields=(),
        exclude_fields=(),
        filter_fields=None,
        connection=None,
        connection_class=None,
        use_connection=None,
        interfaces=(),
        _meta=None,
        **options
    ):
        assert is_valid_django_model(model), (
            'You need to pass a valid Django Model in {}.Meta, received "{}".'
        ).format(cls.__name__, model)

        if not registry:
            registry = get_global_registry()

        assert isinstance(registry, Registry), (
            "The attribute registry in {} needs to be an instance of "
            'Registry, received "{}".'
        ).format(cls.__name__, registry)

        if not DJANGO_FILTER_INSTALLED and filter_fields:
            raise Exception("Can only set filter_fields if Django-Filter is installed")

        django_fields = yank_fields_from_attrs(
            construct_fields(model, registry, only_fields, exclude_fields), _as=Field
        )

        if use_connection is None and interfaces:
            use_connection = any(
                (issubclass(interface, Node) for interface in interfaces)
            )

        if use_connection and not connection:
            # We create the connection automatically
            if not connection_class:
                connection_class = Connection

            connection = connection_class.create_type(
                "{}Connection".format(cls.__name__), node=cls
            )

        if connection is not None:
            assert issubclass(connection, Connection), (
                "The connection must be a Connection. Received {}"
            ).format(connection.__name__)

        if not _meta:
            _meta = DjangoObjectTypeOptions(cls)

        _meta.model = model
        _meta.registry = registry
        _meta.filter_fields = filter_fields
        _meta.fields = django_fields
        _meta.connection = connection

        super(DjangoObjectType, cls).__init_subclass_with_meta__(
            _meta=_meta, interfaces=interfaces, **options
        )

        if not skip_registry:
            registry.register(cls)
