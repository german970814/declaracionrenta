import React, { Component } from 'react'
import { Link, withRouter } from 'react-router-dom'
import {
  Tabs, Input, InputNumber,
  Button, Row, Col, Popover,
  Icon, Collapse
} from 'antd'
import ApiClient from './../../api'
import Queries from './queries'
import './index.css'

const TabPane = Tabs.TabPane


class ConjuntoSet extends Component {

  constructor(props) {
    super(props)
    this.state = {
      child: [],
      loading: false
    }
  }

  get conjunto() {
    const { conjunto } = this.props.data
    return conjunto
  }

  get selectedTab() {
    return this.props.match.params.crud
  }

  /**
   * Retorna verdadero si cumple con la condición de tener un array no vacío en la
   * propiedad o atributo especificado
   * 
   * @param {Object} set Objeto de Relay
   * @param {String} property Propiedad o atributo a ser evaluado
   */
  static hasChild(set, property='childrenSet') {
    if (!set) return false
    return Boolean(set[property].edges) && Boolean(set[property].edges.length)
  }

  componentDidMount() {
    const { conjunto } = this.props.data
    const hasChild = ConjuntoSet.hasChild(conjunto)
    if (!this.selectedTab) {
      const defaultOpenedTab = hasChild ? conjunto.childrenSet.edges[0].node.id : '';
      this.updateHistory(defaultOpenedTab);
    } else {
      this.getChildrensOfNode()
    }
    (this.props.onTabClick && this.selectedTab) && this.props.onTabClick(
      this.getConjuntoByKey(this.selectedTab)
    )
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.match.params.crud !== this.props.match.params.crud) {
      this.getChildrensOfNode()
    }
  }

  /**
   * Función que hace una llamada a la api para obtener el conjunto
   * de acuerdo al tab seleccionado y así obtener sus campos
   */
  getChildrensOfNode() {
    this.setState({ loading: true })
    ApiClient.graphql(
      Queries.getConjuntoByID(this.selectedTab, true)
    ).then(data => {
      const { conjunto } = data.data
      if (conjunto) {
        const hasChild = ConjuntoSet.hasChild(conjunto)
        this.setState({ child: hasChild ? conjunto.childrenSet.edges : [], loading: false })
      } else {
        this.setState({ child: [], loading: false })
      }
    })
  }

  /**
   * Función para ordenar los campos de acuerdo al orden que se estableció en la creación
   * y asignación de campos de un conjunto
   * 
   * @param {Array} campos Conjunto de campos con objetos de acuerdo a la estructura
   * dada por Relay
   */
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
              {<Link to={`/conjuntos/${this.selectedTab}`}>Ver Completo</Link>}
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
        const popoverContent = <span>
          <p>Este botón es demostrativo</p>
          <p>Para que el usuario tenga la opción de repetir este conjunto de campos las veces que sea necesario</p>
        </span>

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
              <Popover placement="left" title="Descripción" content={popoverContent}>
                <Button type="primary" shape="circle" size="large" icon="plus" />
              </Popover>
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

  getConjuntoByKey(key) {
    if (ConjuntoSet.hasChild(this.conjunto)) {
      return this.conjunto.childrenSet.edges.find(conjunto => {
        return conjunto.node.id === key
      })
    }
    return null
  }

  onTabClick(key) {
    if (this.props.onTabClick) {
      const conjunto = this.getConjuntoByKey(key)
      this.props.onTabClick(conjunto)
    }
    this.updateHistory(key)
  }

  updateHistory(tab) {
    if (this.props.match.params.crud) {
      this.props.history.push({
        pathname: this.props.location.pathname.replace(
          this.props.match.params.crud, tab)
      })
    } else {
      this.props.history.push({ pathname: `${this.props.location.pathname}/${tab}` })
    }
  }

  renderContent(conjunto) {
    const hasChild = ConjuntoSet.hasChild(conjunto)

    return !this.state.loading && <Tabs defaultActiveKey={this.selectedTab} tabPosition="top" style={{height: 'auto'}} onTabClick={this.onTabClick.bind(this)}>
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

export default withRouter(ConjuntoSet)
