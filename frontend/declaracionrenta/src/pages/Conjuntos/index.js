import React, { Component } from 'react';
import { Layout, Card, Icon } from 'antd';
import TreeSide from './TreeSide';
import ConjuntoSet from './ConjuntoSet';
import ApiClient from './../../api';
import Queries from './queries';

const { Sider, Content } = Layout

export default class ConjuntosPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      conjuntos: [],
      conjuntoSelected: null,
      loadingCard: null
    }
  }

  componentDidMount() {
    const response = ApiClient.graphql(Queries.CONJUNTOS_BASE);

    response.then(data => {
      const { conjuntosBase } = data.data;
      this.setState({ conjuntos: conjuntosBase.edges });
    })

    if (this.props.match.params.tab) {
      this.setState({ loadingCard: true }, () => {
        this.getConjuntoByTab(this.props.match.params.tab)
      })
    }
  }

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
      actions={[<Icon type="setting" />, <Icon type="edit" />, <Icon type="ellipsis" />]}
      style={{width: '100%'}}
      >
        {this.state.loadingCard === null ? <h5>Escoja un conjunto para empezar</h5> : <div>
          <ConjuntoSet data={this.state.conjuntoSelected} />
        </div>}
      </Card>
  }

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
