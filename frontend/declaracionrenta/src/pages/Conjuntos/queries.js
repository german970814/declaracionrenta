// Queries for graphql api

// TODO REFORM QUERIES


const query = (query, params=null) => {
  if (params) {
    return `query ($params: ${params}) { ${query} }`
  }
  return `query { ${query} }`
}

const pluralizeQuery = (query) => {
  return `edges {
    node { ${query} }
  }`
}

const CAMPO = `
  id, identificador, nombre, numerico, descripcion,
  orden, automatico
`
const CAMPOS = pluralizeQuery(CAMPO)

const CONJUNTO = `
  id, identificador, nombre, campos { ${CAMPOS} },
  descripcion, repetible, requisitos, automatico
`

const _CONDICION_BASE = `
  id, izquierda, unidadIzquierda, tipoIzquierda,
  derecha, unidadDerecha, tipoDerecha
`

const CONDICION_CON_RELAY = `
  ${_CONDICION_BASE},
  valorSi { ${pluralizeQuery(`
    id, izquierda, unidadIzquierda, tipoIzquierda,
    derecha, unidadDerecha, tipoDerecha,
    valorSi { ${pluralizeQuery(_CONDICION_BASE)} },
    valorNo { ${pluralizeQuery(_CONDICION_BASE)} }
  `)} },
  valorNo { ${pluralizeQuery(`
    id, izquierda, unidadIzquierda, tipoIzquierda,
    derecha, unidadDerecha, tipoDerecha,
    valorSi { ${pluralizeQuery(_CONDICION_BASE)} },
    valorNo { ${pluralizeQuery(_CONDICION_BASE)} }
  `)} }
`

const CONJUNTO_SIN_RELAY = `
  id, identificador, nombre, descripcion,
  repetible, requisitos, automatico
`
const CONJUNTOS = pluralizeQuery(CONJUNTO)

const CONJUNTO_CON_CHILDREN = `${CONJUNTO}, childrenSet { ${CONJUNTOS} }`
const CONJUNTOS_CON_CHILDREN = pluralizeQuery(CONJUNTO_CON_CHILDREN)

const CONJUNTOS_CONDICIONES = query(`conjuntos { ${pluralizeQuery(`condicionesSet { ${pluralizeQuery(CONDICION_CON_RELAY)} }` )} }`)

const CONJUNTOS_BASE = query(`conjuntosBase { ${CONJUNTOS_CON_CHILDREN} }`)

const functions = {
  query, pluralizeQuery,
  getConjuntoByID: (id, children=false) => {
    return `query {
      conjunto (id: "${id}") { ${children ? CONJUNTO_CON_CHILDREN : CONJUNTO} }
    }`
  },
  getCondicionesByConjuntoId: (id) => {
    return `query {
      condiciones (conjunto: "${id}") { ${pluralizeQuery(CONDICION_CON_RELAY)} }
    }`
  }
}

const IDENTIFICADOR_SEARCH = query(`
  conjuntos (identificador_Icontains: $params) {
    ${pluralizeQuery('identificador')}
  }
  campos (identificador_Icontains: $params) {
    ${pluralizeQuery('identificador')}
  }`, 'String')

export default {
  CAMPO, CONJUNTOS, CONJUNTOS_CON_CHILDREN,
  CONJUNTO_CON_CHILDREN, CONJUNTO,
  CONJUNTO_SIN_RELAY, IDENTIFICADOR_SEARCH,
  CONJUNTOS_CONDICIONES,
  CONJUNTOS_BASE, ...functions
}
