from django.http import Http404

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view

from graphql_relay import from_global_id

from declaracionrenta.schema import schema
from . import models, serializers, utils
from .queries import Queries


@api_view(['POST'])
def create_condicional(request, pk):
    args, kwargs = tuple(), dict()
    data = utils.convert_graph_data_to_django_data(request.data)
    expanded_fields = serializers.ConjuntoSerializer.get_expanded_fields(data)

    try:
        _module, id = from_global_id(pk)
        instance = models.Conjunto.objects.get(id=id)
    except:
        raise Http404

    serializer = serializers.ConjuntoSerializer(
        instance=instance, data=data, expand=expanded_fields  # , many=True
    )

    if serializer.is_valid():
        condiciones = serializer.save()
        result = schema.execute(Queries.get_conjunto_condiciones(pk))
        args = ({'data': result.data}, )
        kwargs['status'] = status.HTTP_201_CREATED
    else:
        args = ({'errors': serializer.errors}, )
        kwargs['status'] = status.HTTP_400_BAD_REQUEST

    return Response(*args, **kwargs)
