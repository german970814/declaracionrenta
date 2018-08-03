import graphene
from django.utils.translation import ugettext_lazy as _
from graphene_django import DjangoObjectType, DjangoConnectionField
from graphene_django.filter import DjangoFilterConnectionField

from . import models


class BaseNode(graphene.Node):
    """
    Interface para remover el encoding base64 y usar
    el default para los id de django
    """
    pass


class ConjuntoNode(DjangoObjectType):
    class Meta:
        model = models.Conjunto
        filter_fields = ['nombre', 'identificador', 'descripcion']
        interfaces = (BaseNode, )


class CampoNode(DjangoObjectType):
    class Meta:
        model = models.Campo
        filter_fields = {
            'nombre': ['exact', 'icontains', 'istartswith'],
            'identificador': ['exact', 'icontains'],
            'conjunto__identificador': ['exact']
        }
        interfaces = (BaseNode, )


class Query(graphene.AbstractType):
    conjunto = BaseNode.Field(ConjuntoNode)
    conjuntos = DjangoFilterConnectionField(ConjuntoNode, description=_('Todos los conjuntos'))
    conjuntos_base = DjangoFilterConnectionField(ConjuntoNode, description=_('Todos los conjuntos base'))

    campo = BaseNode.Field(CampoNode)
    campos = DjangoFilterConnectionField(CampoNode)

    def resolve_conjuntos_base(self, context, **kwargs):
        return models.Conjunto.objects.last().get_root().get_children()
