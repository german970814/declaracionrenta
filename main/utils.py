import json


def get_json(_object):
    if hasattr(_object, '__json__') and callable(_object.__json__):
        return getattr(_object, '__json__')
    return json.dumps(_object, default=lambda o: o.__dict__, sort_keys=True, indent=4)
