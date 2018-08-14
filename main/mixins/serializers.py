import copy

from graphql_relay import from_global_id

from rest_flex_fields import FlexFieldsModelSerializer as FlexFieldSerializer


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
