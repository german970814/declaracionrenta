import React, { Component } from 'react';
import { Layout, Card, Icon } from 'antd';
import TreeSide from './TreeSide';
import ConjuntoSet from './ConjuntoSet';
import EditConjunto from './EditConjunto'
import ApiClient from './../../api';
import Queries from './queries';

const { Sider, Content } = Layout

export default class ConjuntosPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      conjuntos: [],
      conjuntoSelected: null,
      conjuntoCrud: null,
      loadingCard: null
    }
  }

  componentDidMount() {
    const response = ApiClient.graphql(Queries.CONJUNTOS_BASE);

    response.then(data => {
      const { conjuntosBase } = data.data;
      if (conjuntosBase) {
        this.setState({ conjuntos: conjuntosBase.edges });
      }
    })

    if (this.props.match.params.tab) {
      this.setState({ loadingCard: true }, () => {
        this.getConjuntoByTab(this.props.match.params.tab)
      })
    }
  }

  /**
   * Obtiene el conjunto seleccionado desde la api de acuerdo al tab escogido por el usuario
   * 
   * @param {String} tab Id del tab seleccionado por el usuario, se obtiene de la url
   * y del menú del conjunto
   */
  getConjuntoByTab(tab) {
    this.setState({ loadingCard: true })
    ApiClient.graphql(Queries.getConjuntoByID(tab.replace('-raiz', ''), true)).then(data => {
      this.setState({ loadingCard: false, conjuntoSelected: data.data })
    });
  }

  componentDidUpdate(prevProps, prevState) {
    const { tab=undefined } = this.props.match.params
    if (tab !== prevProps.match.params.tab) {
      this.getConjuntoByTab(tab);
    }
  }

  renderContent() {
    return <Card
      loading={this.state.loadingCard}
      title="Editar campos"
      actions={[<Icon type="setting" />, <EditConjunto conjunto={this.state.conjuntoCrud} />, <Icon type="ellipsis" />]}
      style={{width: '100%'}}
      >
        {this.state.loadingCard === null ? <h5>Escoja un conjunto para empezar</h5> : <div>
          <ConjuntoSet onTabClick={this.onTabClick.bind(this)} data={this.state.conjuntoSelected} />
        </div>}
      </Card>
  }

  onTabClick(conjunto) {
    if (conjunto && conjunto.node) {
      this.setState({ conjuntoCrud: conjunto.node })
    }
  }

  /**
   * Cuando el conjunto es seleccionado, guarda en el localStorage el path
   * para mostrarle nuevamente al usuario donde estaba en caso de abandonar
   * la página y llegar nuevamente por url
   * 
   * @param {EventListenerObject} event 
   */
  conjuntoOptionSelected(event) {
    window.localStorage.setItem('keyPath', JSON.stringify(event.keyPath))
    if (event.key !== this.props.match.params.tab) {
      this.props.history.push({ pathname: `/conjuntos/tab=${event.key}` });
    }
  }

  render() {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Sider width={350}>
          <TreeSide
            defaultSelectedKeys={[this.props.match.params.tab]}
            conjuntos={this.state.conjuntos}
            onItemClick={this.conjuntoOptionSelected.bind(this)} />
        </Sider>
        <Layout>
          <Content style={{padding: 20}}>
            {this.renderContent()}
          </Content>
        </Layout>
      </Layout>
    );
  }
}
