import graphene
import django.http
from django.utils.translation import ugettext_lazy as _
from graphene_django import DjangoObjectType, DjangoConnectionField
from graphene_django.filter import DjangoFilterConnectionField
from graphene_django.rest_framework.mutation import SerializerMutation

from . import models, serializers, mixins


class BaseNode(graphene.Node):
    """
    Interface para remover el encoding base64 y usar
    el default para los id de django
    """
    # @staticmethod
    # def to_global_id(type, id):
    #     return id

    # @staticmethod
    # def get_node_from_global_id(info, global_id, only_type=None):
    #     id = global_id


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


class CampoNodeMutation(mixins.ModelSerializerObjectType, SerializerMutation):
    class Meta:
        serializer_class = serializers.CampoSerializer
        model_operations = ['create', 'update']
        lookup_field = 'id'


class ConjuntoNodeMutation(mixins.ModelSerializerObjectType, SerializerMutation):
    class Meta:
        serializer_class = serializers.ConjuntoSerializer
        model_operations = ['create', 'update']
        lookup_field = 'id'

    @classmethod
    def get_initial_serializer_kwargs(cls):
        return {'expand': ['campos']}

    @classmethod
    def get_serializer_kwargs(cls, root, info, **input):
        kwargs = super(cls, ConjuntoNodeMutation).get_serializer_kwargs(root, info, **input)
        variable_values = info.variable_values
        if 'params' in info.variable_values:
            kwargs['expand'] = ['campos'] if 'campos' in info.variable_values['params'] else []
        return kwargs


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
    conjunto_create_update = ConjuntoNodeMutation.Field()
