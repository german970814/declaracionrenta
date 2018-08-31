from django.http import Http404
from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view

from graphql_relay import from_global_id

from declaracionrenta.schema import schema
from . import models, serializers, utils
from .queries import Queries


@api_view(['POST'])
def create_condicional(request, pk):
    '''
    Crea condicionales a partir de un conjunto.
    Para crear los condicionales, espera los datos requeridos del
    serializer de `main.serializers.ConjuntoSerializer` en un JSON
    junto con los datos de las condiciones en una llave llamada
    `condicion_set`

    :params:
        `request`: La petición
        `pk str`: El ID del conjunto en el formato dado por la interface de
            Relay
    
    :returns:
        JSON con el formato de consulta de un objeto en GraphQl y Relay
    '''
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


@api_view(['DELETE'])
def remove_conjunto(request, pk):
    '''
    Remueve un conjunto de la base de datos.
    Remueve el producto a partir del ID del conjunto en formato de la interface
    de Relay de GraphQl

    :params:
        `request`: La petición
        `pk str`: El ID del conjunto en el formato dado por la interface de
            Relay
    
    :return:
        JSON con el estado de la transacción
        Status 202: Se eliminó
        Status 400: No se eliminó
    '''
    args, kwargs = tuple(), dict()

    _module, id = from_global_id(pk)
    instance = get_object_or_404(models.Conjunto, pk=id)

    try:
        deleted, _w = instance.delete()

        if deleted < 1:
            args = ({'error': 'Object "{}" with pk #{} can\'t was deleted'.format(
                models.Conjunto.__name__, id
            )},)
            kwargs['status'] = status.HTTP_400_BAD_REQUEST
        else:
            args = ({'data': 'Object "{}" with pk #{} was deleted'.format(
                models.Conjunto.__name__, id
            )},)
            kwargs['status'] = status.HTTP_202_ACCEPTED
    except Exception as exc:
        args = ({'error': exc.__str__()}, )
        kwargs['status'] = status.HTTP_400_BAD_REQUEST

    return Response(*args, **kwargs)
