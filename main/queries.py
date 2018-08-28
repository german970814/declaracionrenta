class Queries:

    @classmethod
    def get_conjunto_condiciones(cls, pk):
        return '''
            query {
                conjunto (id: "pk") {
                    id, condicionesSet {
                        edges {
                            node {
                                id, orden, izquierda, derecha,
                                tipoIzquierda, tipoDerecha,
                                unidadIzquierda, unidadDerecha,
                                valorSi {
                                    edges {
                                        node {
                                            id, orden, izquierda, derecha,
                                            tipoIzquierda, tipoDerecha,
                                            unidadIzquierda, unidadDerecha,
                                            valorSi {
                                                edges {
                                                    node {
                                                        id, orden, izquierda, derecha,
                                                        tipoIzquierda, tipoDerecha,
                                                        unidadIzquierda, unidadDerecha
                                                    }
                                                }
                                            },
                                            valorNo {
                                                edges {
                                                    node {
                                                        id, orden, izquierda, derecha,
                                                        tipoIzquierda, tipoDerecha,
                                                        unidadIzquierda, unidadDerecha
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                valorNo {
                                    edges {
                                        node {
                                            id, orden, izquierda, derecha,
                                            tipoIzquierda, tipoDerecha,
                                            unidadIzquierda, unidadDerecha,
                                            valorSi {
                                                edges {
                                                    node {
                                                        id, orden, izquierda, derecha,
                                                        tipoIzquierda, tipoDerecha,
                                                        unidadIzquierda, unidadDerecha
                                                    }
                                                }
                                            },
                                            valorNo {
                                                edges {
                                                    node {
                                                        id, orden, izquierda, derecha,
                                                        tipoIzquierda, tipoDerecha,
                                                        unidadIzquierda, unidadDerecha
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        '''.replace('pk', pk)
