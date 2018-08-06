import graphene
from django.utils.translation import ugettext_lazy as _
from graphene_django import DjangoObjectType, DjangoConnectionField
from graphene_django.filter import DjangoFilterConnectionField
from graphene_django.rest_framework.mutation import SerializerMutation

from . import models, serializers


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


class CampoNodeMutation(SerializerMutation):
    class Meta:
        serializer_class = serializers.CampoSerializer
        model_operations = ['create', 'update']
        lookup_field = 'id'

    @classmethod
    def get_serializer_kwargs(cls, root, info, **input):
        if 'id' in input:
            instance = models.Campo.objects.get(id=input.get('id', None))
            if instance:
                return {
                    'instance': instance, 'data': input, 'partial': True
                }
            else:
                from django.http import Http404
                raise Http404
        return {'data': input, 'partial': True}


class ConjuntoNodeMutation(SerializerMutation):
    class Meta:
        serializer_class = serializers.ConjuntoSerializer
        model_operations = ['create', 'update']
        lookup_field = 'id'

    @classmethod
    def get_serializer_kwargs(cls, root, info, **input):
        if 'id' in input:
            instance = models.Conjunto.objects.get(id=input.get('id', None))
            if instance:
                return {
                    'instance': instance, 'data': input, 'partial': True
                }
            else:
                from django.http import Http404
                raise Http404
        return {'data': input, 'partial': True}


class Query(graphene.AbstractType):
    conjunto = BaseNode.Field(ConjuntoNode)
    conjuntos = DjangoFilterConnectionField(ConjuntoNode, description=_('Todos los conjuntos'))
    conjuntos_base = DjangoFilterConnectionField(ConjuntoNode, description=_('Todos los conjuntos base'))

    campo = BaseNode.Field(CampoNode)
    campos = DjangoFilterConnectionField(CampoNode)

    def resolve_conjuntos_base(self, context, **kwargs):
        return models.Conjunto.objects.last().get_root().get_children()


class Mutation(graphene.AbstractType):
    # create_campo = BaseNode.Field(CampoNodeMutation)
    campo_create_update = CampoNodeMutation.Field()
    conjunt_create_update = ConjuntoNodeMutation.Field()
