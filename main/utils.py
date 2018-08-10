import json

from collections import OrderedDict

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
