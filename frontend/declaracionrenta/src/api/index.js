
export default class Client {
  static base_url = process.env.REACT_APP_API_URL;
  static client = window.fetch.bind(window);

  static graphql(query) {
    const payload = {
      headers: {
        // 'Access-Control-Allow-Origin': '*'
        'Content-Type': 'application/json'
      },
      // mode: 'no-cors',
      // credentials: 'include',
      method: 'POST',
      body: JSON.stringify({
        query: query
      })
    }

    return Client.client(`${Client.base_url}/graphql`, { ...payload }).then(response => {
      return response.json();
    });
  }
}
