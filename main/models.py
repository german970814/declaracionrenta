from django.db import models
from django.conf import settings
from django.utils import timezone
from treebeard.al_tree import AL_Node
from django.utils.translation import ugettext_lazy as _
from django.contrib.postgres.fields import JSONField

from . import managers
from .utils import get_json
from .mixins import SerializableMixin


class Settings(models.Model):
    """Clase para guardar constantes y variables de usuario"""

    UVT = models.PositiveIntegerField()

    def __str__(self):
        return 'Main Settings'

    def save(self, *args, **kwargs):
        setting = self.__class__.objects.first()
        if (setting and self.pk == setting.pk) or setting is None:
            return super().save(*args, **kwargs)
        raise ValueError(_('No se puede guardar mas de un Setting'))


class Condicion(SerializableMixin, models.Model):
    """
    Modelo para guardar condicionales para hacer operaciones sobre campos.
    Las condiciones son aquellas que determinan el funcionamiento o los
    calculos que debe hacer un campo específico.

    Consta de un campo el cual hace referencia a la parte izquierda de la
    operación, y otro campo el cual hace referencia a su parte derecha.

    Para ampliar su funcionamiento, tiene un campo de concatenación con
    una relación hacia el mismo con el fin de buscar dentro de las relaciones
    que otros campos hay en derecha o izquierda para crear condiciones
    mas complejas. Se tendrá en cuenta el orden para efectuar las operaciones.

    Tiene un campo para guardar el valor si se cumple la condicion y otro
    en caso que no se cumpla. Para obtener resultados de este modelo, se puede
    consultar los resultados de otros campos u otras secciones.
    """

    SERIALIZER_CLASS = 'main.serializers.CondicionSerializer'

    # constantes
    MAYOR_QUE = '>'
    MENOR_QUE = '<'
    IGUAL_QUE = '='
    MAYOR_IGUAL_QUE = '>='
    MENOR_IGUAL_QUE = '<='
    DIFERENTE_QUE = '<>'
    SUMA = '+'
    MULTIPLICA = '*'
    DIVIDE = '/'
    RESTA = '-'

    TIPO = (
        (MAYOR_QUE, _('Mayor que')),
        (MENOR_QUE, _('Menor que')),
        (IGUAL_QUE, _('Igual que')),
        (MAYOR_IGUAL_QUE, _('Mayor o igual que')),
        (MENOR_IGUAL_QUE, _('Menor o igual que')),
        (DIFERENTE_QUE, _('Diferente que')),
        (SUMA, _('Suma')),
        (MULTIPLICA, _('Multiplicación')),
        (DIVIDE, _('División')),
        (RESTA, _('Resta')),
    )

    # Puede ser id, numero, porcentaje
    izquierda = models.CharField(max_length=255, verbose_name=_('Izquierda'), blank=True)
    derecha = models.CharField(max_length=255, verbose_name=_('Derecha'), blank=True)
    tipo = models.CharField(max_length=2, verbose_name=_('Tipo'), blank=True, choices=TIPO)
    condiciones = models.ManyToManyField(
        'self', verbose_name=_('Condiciones'), related_name='condiciones_set')
    orden = models.PositiveSmallIntegerField(verbose_name=_('Orden'), blank=True, null=True)
    uvt = models.NullBooleanField(verbose_name=_('UVT'), null=True)
    # Puede ser id, numero, porcentaje, izquierda o derecha
    valor_si = models.CharField(max_length=255, verbose_name=_('Valor SI'), blank=True)  
    valor_no = models.CharField(max_length=255, verbose_name=_('Valor NO'), blank=True)
    campo = models.ForeignKey(
        'main.Campo', verbose_name=_('Campo'), blank=True, null=True,
        related_name='condiciones_set', on_delete=models.CASCADE)
    conjunto = models.ForeignKey(
        'main.Conjunto', verbose_name=_('Conjunto'), blank=True, null=True,
        related_name='condiciones_set', on_delete=models.CASCADE)

    class Meta:
        verbose_name = _('Condición')
        verbose_name_plural = _('Condiciones')

    def __str__(self):
        return 'Condicion #{}'.format(self.pk)


class Campo(SerializableMixin, models.Model):
    """
    Modelo que contendrá cada uno de los campos que se tienen en cuenta al momento
    de crear una declaración de renta. Los campos pueden ser con valor en texto
    para guardar detalles, o numéricos para hacer calculos.

    Cada campo cuenta con una descripción, la cuál será usada como texto de guía
    para el usuario y tendrán un orden específico de acuerdo a la lista de campos
    (conjunto) donde se encuentren. Además, cada campo deberá tener un identificador
    único para ligarlo a listas y condiciones.
    """

    SERIALIZER_CLASS = 'main.serializers.CampoSerializer'

    nombre = models.CharField(max_length=255, verbose_name=_('Nombre'))
    numerico = models.NullBooleanField(verbose_name=_('Numérico'), null=True)
    descripcion = models.TextField(verbose_name=_('Descripción'), blank=True)
    orden = models.PositiveSmallIntegerField(verbose_name=_('Orden'), blank=True, null=True)
    valor_texto = models.CharField(max_length=255, verbose_name=_('Valor texto'), blank=True)
    valor_numerico = models.IntegerField(verbose_name=_('Valor numérico'), blank=True, null=True)
    identificador = models.CharField(max_length=255, verbose_name=_('Identificador'), blank=True)
    automatico = models.NullBooleanField(verbose_name=_('Automático'), null=True)
    conjunto = models.ForeignKey(
        'main.Conjunto', verbose_name=_('Conjunto'),
        related_name='campos', on_delete=models.CASCADE
    )

    objects = managers.CampoManager()

    class Meta:
        verbose_name = _('Campo')
        verbose_name_plural = _('Campos')

    def __str__(self):
        if self.identificador:
            return 'Campo "{self.identificador}" #{self.id}'.format(self=self)
        return 'Campo #{}'.format(self.id)

    @property
    def condiciones(self):
        return self.condiciones_set.order_by('orden', 'pk')


class Conjunto(SerializableMixin, AL_Node):
    """
    Modelo para guardar los conjuntos de campos que pueden tener una estructura de arbol.
    Hereda de la clase `treebeard.mp_tree.AL_Node` para mantener la estructura de arbol
    de modo que un conjunto pueda contener dentro otro conjunto de campos
    """

    SERIALIZER_CLASS = 'main.serializers.ConjuntoSerializer'

    parent = models.ForeignKey(
        'self', related_name='children_set',
        null=True, db_index=True,
        on_delete=models.CASCADE
    )
    descripcion = models.TextField(verbose_name=_('Descripción'), blank=True)
    nombre = models.CharField(max_length=255, verbose_name=_('Nombre'), blank=True)
    identificador = models.CharField(max_length=255, verbose_name=_('Identificador'))
    # Hacer uso de formset con este campo
    repetible = models.NullBooleanField(verbose_name=_('Repetible'), null=True)
    requisitos = models.TextField(verbose_name=_('Requisitos'), blank=True)
    automatico = models.NullBooleanField(verbose_name=_('Automático'), null=True)

    node_order_by = ['id']

    class Meta:
        verbose_name = _('Conjunto')
        verbose_name_plural = _('Conjuntos')
    
    def __str__(self):
        return 'Conjunto "{self.identificador}"'.format(self=self)

    @classmethod
    def get_declaracion_tree(cls):
        try:
            serializer_class = cls.get_serializer_class()
            print(self.get_tree(0))
        except ImportError:
            raise ImportError(_('No se encontró el serializer para %s' % cls.__name__))

    @property
    def condiciones(self):
        return self.condiciones_set.order_by('orden', 'pk')

    def get_total(self):
        campos = self.campos.numericos()


class Declaracion(SerializableMixin, models.Model):
    """
    Modelo para guardar las declaraciones de renta que haga cada usuario.
    Este modelo guardará la fecha de creación y el timestamp de modificación.

    El formato dependerá de la relación entre los conjuntos y los campos. En
    los formatos es donde se guarda toda la información de la declaración de
    renta.
    """

    formato = JSONField(verbose_name=_('Formato'))
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_ultima_modificacion = models.DateTimeField(auto_now=True)
    usuario = models.ForeignKey(
        'main.Usuario', related_name='declaraciones',
        on_delete=models.CASCADE
    )

    class Meta:
        verbose_name = _('Declaración de Renta')
        verbose_name_plural = _('Declaraciones de Renta')

    def __str__(self):
        year = self.fecha_creacion.year
        return 'Declaracion de {usuario} del año {year}'.format(
            usuario=str(self.usuario), year=year)


class Usuario(models.Model):
    """
    Modelo para guardar los datos del usuario.

    Se guardan los datos de identificación personal del usuario, así como los datos
    de una cuenta de ingreso para consultar su declaración de renta
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name='usuario', on_delete=models.CASCADE)
    primer_nombre = models.CharField(max_length=255, verbose_name=_('Primer nombre'))
    segundo_nombre = models.CharField(max_length=255, verbose_name=_('Segundo nombre'), blank=True)
    primer_apellido = models.CharField(max_length=255, verbose_name=_('Primer apellido'))
    segundo_apellido = models.CharField(max_length=255, verbose_name=_('Segundo apellido'))
    nit = models.IntegerField(verbose_name=_('N. Identificación Tributaria (NIT)'))
    nacionalidad = models.CharField(max_length=255, verbose_name=_('Nacionalidad'))
    telefono = models.IntegerField(verbose_name=_('Telefono'), blank=True, null=True)
    direccion = models.CharField(max_length=255, verbose_name=_('Dirección'), blank=True)

    def __str__(self):
        return \
            '{self.primer_nombre} {self.primer_apellido} {self.segundo_apellido} ({self.nit})'.format(
                self=self
            )
