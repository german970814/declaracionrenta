
const mutate = (name, input, options) => {
  const JSONInput = JSON.stringify(input)
  const { query, type } = options

  const _query = `mutation ${name.toUpperCase()} ($params: ${type}!) {
    ${name} (input: $params) { ${query} }
  }`

  const variables = `{
    "params": ${JSONInput}
  }`

  console.log(JSONInput)

  return [_query, variables, name.toUpperCase()]
}

export {
  mutate
}

export default mutate
