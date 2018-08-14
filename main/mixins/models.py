from django.utils.module_loading import import_string


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
