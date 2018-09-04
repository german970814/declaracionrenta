import copy

from django.db import transaction
from django.utils.module_loading import import_string

from graphql_relay import from_global_id

from rest_flex_fields import FlexFieldsModelSerializer as FlexFieldSerializer

from rest_framework.utils import model_meta


class FlexFieldsModelSerializer(FlexFieldSerializer):
    """FlexField para AL_Node"""
    def __init__(self, *args, **kwargs):
        self.depth = kwargs.pop('depth', None)
        super().__init__(*args, **kwargs)

    @classmethod
    def get_related_schema_class(cls):
        """Singleton para retornar el schema de la clase"""
        schema_class = getattr(cls, '_schema_class', None)
        if not schema_class and hasattr(cls, 'SCHEMA_CLASS'):
            cls._schema_class = schema_class = import_string(cls.SCHEMA_CLASS)
        return schema_class

    @classmethod
    def get_expanded_fields(cls, data):
        """Retorna una lista de los campos expandidos de acuerdo a los parámetros."""
        expanded_fields = []

        if hasattr(cls, 'expandable_fields'):
            for field in data:
                if field in cls.expandable_fields and isinstance(
                    data[field], (dict, tuple, list)
                ):
                    expanded_fields.append(field)
        return expanded_fields

    def _make_expanded_field_serializer(self, name, nested_expands, nested_includes):
        """
        Returns an instance of the dynamically created nested
        serializer.
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
            __, id = from_global_id(data.get('id'))
        return id

    def create(self, validated_data):
        # TODO
        # importante, no hay soporte para crear un nuevo modelo en ForeingKey
        # si o sí debe venir con el id incluido
        info = model_meta.get_field_info(self.Meta.model)
        many_to_many = [x for x in info.relations if info.relations[x].to_many]

        with transaction.atomic():
            if all([x not in many_to_many for x in self.expanded_fields]):
                # Si no hay many to many fields
                instance = super().create(validated_data)
            else:
                relations = {field: validated_data.get(field) for field in validated_data if field in many_to_many}
                [validated_data.pop(relation) for relation in relations]
                instance = self.Meta.model.objects.create(**validated_data)

                for field in relations:
                    if field in self.expanded_fields:
                        serializer_class = self._import_serializer_class(
                            self.expandable_fields[field][0])
                        model_field = serializer_class.Meta.model
                        instances = []

                        assert isinstance(relations[field], (list, tuple))

                        for data in relations[field]:
                            relation_instance = None

                            if 'id' in data:
                                relation_instance = model_field.objects.get(id=data.get('id'))

                            expanded_fields = serializer_class.get_expanded_fields(data)
                            serializer = serializer_class(
                                data=data, instance=relation_instance, expand=expanded_fields
                            )

                            if serializer.is_valid():
                                instances.append(serializer.save())
                            else:
                                print(serializer.errors)
                        getattr(instance, field).set(instances, clear=True)
                    else:
                        pass
        return instance

    def update(self, instance, validated_data):
        default_kwargs_data = {
            'campos': {
                'conjunto': instance.id if instance else None
            }
        }

        info = model_meta.get_field_info(self.Meta.model)
        many_to_many = [x for x in info.relations if info.relations[x].to_many]

        with transaction.atomic():
            kwargs = {}
            for field in self.expanded_fields:
                if field in many_to_many:
                    instances = []
                    data_field = self.data.get(field)
                    validated_data_field = validated_data.get(field)

                    if validated_data_field:
                        serializer_class = self._import_serializer_class(
                            self.expandable_fields[field][0])
                        model_field = serializer_class.Meta.model

                        for index, data in enumerate(validated_data_field):
                            data_instance = None
                            if (len(data_field) - 1) >= index and 'id' in data_field[index]:
                                data_instance = model_field.objects.get(id=data_field[index].get('id'))
                            elif field in default_kwargs_data:
                                data.update(default_kwargs_data[field])  # esto puede ser redundante

                            expanded_fields = serializer_class.get_expanded_fields(data)
                            serializer = serializer_class(
                                instance=data_instance, data=data, expand=expanded_fields)

                            if serializer.is_valid():
                                instances.append(serializer.save())
                            else:
                                print(serializer.errors)
                        getattr(instance, field).set(instances)

            for field in validated_data:
                if field in self.expanded_fields:
                    continue
                kwargs[field] = validated_data[field]
            instance.update(**kwargs)
        return instance
