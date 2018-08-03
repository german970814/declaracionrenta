import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import {
  Tabs, Input, InputNumber,
  Button, Row, Col, Popover,
  Icon, Collapse
} from 'antd'
import ApiClient from './../../api'
import Queries from './queries'
import './index.css'

const TabPane = Tabs.TabPane


export default class ConjuntoSet extends Component {

  constructor(props) {
    super(props)
    this.state = {
      selectedTab: null,
      child: []
    }
  }

  static hasChild(set, property='childrenSet') {
    return Boolean(set[property].edges) && Boolean(set[property].edges.length)
  }

  componentDidMount() {
    const { conjunto } = this.props.data
    const hasChild = ConjuntoSet.hasChild(conjunto)
    const defaultOpenedTab = hasChild ? conjunto.childrenSet.edges[0].node.id : ''
    this.setState({ selectedTab: defaultOpenedTab });
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.selectedTab !== this.state.selectedTab) {
      this.getChildrensOfNode()
    }
  }

  getChildrensOfNode() {
    ApiClient.graphql(
      Queries.getConjuntoByID(this.state.selectedTab, true)
    ).then(data => {
      const { conjunto } = data.data
      if (conjunto) {
        const hasChild = ConjuntoSet.hasChild(conjunto)
        this.setState({ child: hasChild ? conjunto.childrenSet.edges : [] })
      } else {
        this.setState({ child: [] })
      }
    })
  }

  sort(campos) {
    return campos.sort((a, b) => {
      return a.node.orden > b.node.orden
    })
  }

  resolveCampoLabel(campo) {
    if (campo.descripcion) {
      return <Popover title="Descripción" content={<p>{campo.descripcion}</p>}>
        <strong className="fieldset-title">{campo.nombre}</strong>
      </Popover>
    }
    return <strong className="fieldset-title">{campo.nombre}</strong>
  }

  resolveCampo(campo, label=true) {
    if (campo.numerico) {
      return <div>
        {label && this.resolveCampoLabel(campo)}
        <InputNumber
          formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value.replace(/\$\s?|(,*)/g, '')}
          />
      </div>
    }
    return <div>
        {label && this.resolveCampoLabel(campo)}
        <Input />
      </div>
  }

  renderChildrenSet() {
    if (Boolean(this.state.child) && Boolean(this.state.child.length)) {
      const childrens = this.state.child
      return <Row>
        <Collapse bordered={false}>
          {childrens.map((conjunto, index) => {
            const header = <span>
              {`${conjunto.node.nombre} `}
              {<Link to={`/conjuntos/tab=${this.state.selectedTab}`}>Ver Completo</Link>}
            </span>
            return <Collapse.Panel
              key={index}
              header={header}
              style={{
                background: '#f7f7f7',
                borderRaius: 4, marginBottom: 24,
                border: 0, overflow: 'hidden'
              }}
            >
              {this.renderCampos(conjunto.node)}
            </Collapse.Panel>
          })}
        </Collapse>
      </Row>
    }
  }

  renderCampos(node) {
    if (ConjuntoSet.hasChild(node, 'campos')) {
      const campos = node.campos.edges
      if (node.repetible) {
        return <React.Fragment>
          <Row gutter={8 * campos.length}>
            {this.sort(campos).map((campo, index) => {
              return <Col key={index} span={24 / campos.length}>
                {this.resolveCampo(campo.node)}
              </Col>
            })}
          </Row>
          <Row>
            <Col span={24} push={22}>
              <Button type="primary" shape="circle" size="large" icon="plus" />
            </Col>
          </Row>
        </React.Fragment>
      } else {
        return <React.Fragment>
          <Row gutter={8}>
            {this.sort(campos).map((campo, index) => {
              return <React.Fragment key={index}>
                <Col span={8}>{this.resolveCampoLabel(campo.node)}</Col>
                <Col span={16}>{this.resolveCampo(campo.node)}</Col>
              </React.Fragment>
            })}
          </Row>
        </React.Fragment>
      }
    }
  }

  renderTabContent(node) {
    return <React.Fragment>
      {this.renderCampos(node)}
      {this.renderChildrenSet()}
    </React.Fragment>
  }

  onTabClick(key) {
    this.setState({ selectedTab: key })
  }

  renderContent(conjunto) {
    const hasChild = ConjuntoSet.hasChild(conjunto)

    return <Tabs defaultActiveKey={this.state.selectedTab} tabPosition="top" style={{height: 'auto'}} onTabClick={this.onTabClick.bind(this)}>
      {hasChild ?
        conjunto.childrenSet.edges.map((conjunto) => {
          return <TabPane tab={conjunto.node.nombre} key={conjunto.node.id}>{this.renderTabContent(conjunto.node)}</TabPane>
        }) : null
      }
      <TabPane key="new" tab={<span><Icon type="plus" />New</span>}></TabPane>
    </Tabs>
  }

  render() {
    const { conjunto } = this.props.data
    return <div>
      {conjunto && this.renderContent(conjunto)}
    </div>
  }

}
