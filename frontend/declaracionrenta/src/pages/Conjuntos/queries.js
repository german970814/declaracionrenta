// Queries for graphql api

// TODO REFORM QUERIES


const query = (query) => {
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
const CONJUNTOS = pluralizeQuery(CONJUNTO)

const CONJUNTO_CON_CHILDREN = `${CONJUNTO}, childrenSet { ${CONJUNTOS} }`
const CONJUNTOS_CON_CHILDREN = pluralizeQuery(CONJUNTO_CON_CHILDREN)

const CONJUNTOS_BASE = query(`conjuntosBase { ${CONJUNTOS_CON_CHILDREN} }`)

const functions = {
  query, pluralizeQuery,
  getConjuntoByID: (id, children=false) => {
    return `query {
      conjunto (id: "${id}") { ${children ? CONJUNTO_CON_CHILDREN : CONJUNTO} }
    }`
  }
}

export default {
  CAMPO, CONJUNTOS, CONJUNTOS_CON_CHILDREN,
  CONJUNTOS_BASE, ...functions
}
