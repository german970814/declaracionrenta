
export default class Client {
  static base_url = process.env.REACT_APP_API_URL;
  static client = window.fetch.bind(window);

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
