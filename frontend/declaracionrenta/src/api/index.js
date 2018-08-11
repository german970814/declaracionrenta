
export default class Client {
  static base_url = process.env.REACT_APP_API_URL;
  static client = window.fetch.bind(window);

  /**
   * Función para hacer las llamadas a la api de graphQL
   * 
   * @param {String} query Query que será enviado a la api de graphQl para el retorno
   * de datos
   * @param {Object} variables Las variables que serán enviadas en las mutaciones o querys
   * de acuerdo al protocolo de graphQl
   * @param {String} operationName Nombre de la operación con la cual se identificará
   * el proceso en el cliente de graphQl
   */
  static graphql(query, variables=null, operationName=null) {
    const defaultOptions = {}

    if (variables !== null) {
      defaultOptions['variables'] = variables
    }

    if (operationName !== null) {
      defaultOptions['operationName'] = operationName
    }

    const payload = {
      headers: {
        // 'Access-Control-Allow-Origin': '*'
        'Content-Type': 'application/json'
      },
      // mode: 'no-cors',
      // credentials: 'include',
      method: 'POST',
      body: JSON.stringify({
        query: query,
        ...defaultOptions
      })
    }

    return Client.client(`${Client.base_url}/graphql`, { ...payload }).then(response => {
      return response.json();
    });
  }
}
