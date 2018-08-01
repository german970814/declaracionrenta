from django.utils.module_loading import import_string
from rest_flex_fields import FlexFieldsModelSerializer as FlexFieldSerializer

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
