from django.db import models
from django.utils.translation import ugettext_lazy as _


class Campo(models.Model):
    """
    Campo principal
    """

    descripcion = models.CharField(max_length=255)
    valor = models.IntegerField()
    fieldset = models.ForeignKey(FieldSet)

    campos = models.ManyToMany('main.models.Campo')


class FieldSet(models.Model):
    """
    FieldSet para campos
    """

    identificador = models.CharField(max_length=255)
    descripcion = models.CharField(max_length=255)
    fieldset = models.ForeignKey('main.models.FieldSet')

    @property
    def total(self):
        """retorna el total de todos los campos"""
        return self.campos.aggregate(total=models.Sum('valor'))


class Settings(models.Model):
    UVT = models.PositiveIntegerField()

class Declaracion(models.Model):
    pass














class Condicion(models.Model):
    izquierda = pass
    condicion = pass



class Campo(models.Model):
    nombre = models.CharField()
    descripcion = models.TextField()
    valor_texto = models.CharField()
    valor_numerico = models.IntegerField()
    orden = models.PositiveSmallIntegerField()
    numerico = models.NullBooleanField(default=True)
    identificador = models.CharField()

    set_ = models.ForeignKey(Set)


class Set(models.Model):
    descripcion = models.TextField()
    nombre = models.CharField()
    repetir = models.NullBooleanField(default=True)
    identificador = models.CharField()
