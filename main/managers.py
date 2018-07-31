from django.db import models
# from treebeard.al_tree import AL_NodeManager

class CampoQuerySet(models.QuerySet):
    """QuerySet para el modelo de Campo"""

    def numericos(self):
        """Retorna todos los campos numéricos."""
        return self.filter(numerico=True)


class CampoManager(models.Manager.from_queryset(CampoQuerySet)):
    """Clase de manager para campos"""
    pass
