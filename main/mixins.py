from django.utils.module_loading import import_string


class SerializableMixin:

    @classmethod
    def get_serializer_class(cls):
        """Singleton para retornar el serializer de la clase"""
        serializer_class = getattr(cls, '_serializer_class', None)
        if not serializer_class and hasattr(cls, 'SERIALIZER_CLASS'):
            cls._serializer_class = serializer_class = import_string(cls.SERIALIZER_CLASS)
        return serializer_class
