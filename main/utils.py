import json

from collections import OrderedDict

from graphene.utils.str_converters import to_snake_case

from .serializer_converter import convert_serializer_field


def get_json(_object):
    if hasattr(_object, '__json__') and callable(_object.__json__):
        return getattr(_object, '__json__')
    return json.dumps(_object, default=lambda o: o.__dict__, sort_keys=True, indent=4)


def fields_for_serializer(serializer, only_fields, exclude_fields, is_input=False):
    fields = OrderedDict()
    for name, field in serializer.fields.items():
        is_not_in_only = only_fields and name not in only_fields
        is_excluded = (
            name
            in exclude_fields  # or
            # name in already_created_fields
        )

        if is_not_in_only or is_excluded:
            continue

        fields[name] = convert_serializer_field(field, is_input=is_input)
    return fields


def convert_graph_data_to_django_data(data):
    '''
    Convierte los datos enviados desde el cliente en datos legibles
    para los serializers. Básicamente cambia todos los keys de los
    campos de `camelCase` a `under_scored` o `snake_case`

    :params:
        :data: **dict** Los datos a ser tratados
    '''
    django_data = OrderedDict()

    for field in data:
        underscored = to_snake_case(field)
        if isinstance(data[field], dict):
            django_data[underscored] = convert_graph_data_to_django_data(data[field])
        elif isinstance(data[field], list):
            django_data[underscored] = [
                convert_graph_data_to_django_data(f) for f in data[field]
            ]
        else:
            django_data[underscored] = data[field]
    return django_data
