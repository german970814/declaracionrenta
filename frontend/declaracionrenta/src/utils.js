
/**
 * Función para quitar el formato que es agregado por relay
 * y ayuda a normalizar los arreglos
 * 
 * @param {Array} array Arreglo a partir del cual se hará el unRelay
 */
function unRelay(array) {
  let list = [...array]
  return list.map((item) => {
    const { node } = item
    if (node) {
      for (let field in node) {
        if (node[field] && node[field].edges) {
          node[field] = unRelay(node[field].edges)
        }
      }
      item = Object.assign({}, item, node)
      delete item['node']
    }
    return item
  })
}

export { unRelay }
