import React, { Component } from 'react'
import { Modal, Button, Form, Card, Icon } from 'antd'
import ApiClient from './../../api';
import Queries from './queries'
import { Droppable } from './../../components/DragAndDrop'
import FormCondicion from './forms/FormCondicion'
import { unRelay } from './../../utils'
import crypto from 'crypto'


class Condiciones extends Component {

  constructor(props) {
    super(props)

    this.OPCIONES_IZQUIERDA = {
      '>': 'MAYOR QUE',
      '<': 'MENOR QUE',
      '=': 'IGUAL QUE',
      '>=': 'MAYOR O IGUAL QUE',
      '<=': 'MENOR O IGUAL QUE',
      '<>': 'DIFERENTE QUE',
      '+': 'SUMA',
      '*': 'MULTIPLICACIÓN',
      '/': 'DIVISIÓN',
      '-': 'RESTA'
    }

    this.OPCIONES_DERECHA = {
      ...this.OPCIONES_IZQUIERDA,
      '%': 'PORCENTAJE',
      'UVT': 'UVT'
    }

    this.state = {
      loading: false,
      visible: false,
      dataSource: [],
      condiciones: []
    }
  }

  componentDidMount() {
    if (!Boolean(this.state.condiciones.length)) {
      this.getCondiciones()
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.model.id !== this.props.model.id) {
      this.getCondiciones()
    }
  }

  normalizeCondiciones(condiciones) {
    const MAP_UNIDADES = {
      '_': '%', '__1': 'UVT', '_UVT': 'UVT', '_vod': '', 'UVT': 'UVT'
    }
    const MAP_TIPOS = {
      '_': '>', '__1': '<', '__2': '=', '__3': '>=',
      '__4': '<=', '__5': '<>', '__6': '+', '__7': '*',
      '__8': '/', '__9': '-', '_vod': ''
    }

    return condiciones.map((condicion) => {
      Object.keys(condicion).forEach((key) => {
        if (key === 'unidadIzquierda' || key === 'unidadDerecha') {
          condicion[key] = MAP_UNIDADES[condicion[key]] || ''
        } else if (key === 'tipoIzquierda' || key === 'tipoDerecha') {
          condicion[key] = MAP_TIPOS[condicion[key]] || ''
        } else if (key === 'valorSi' || key === 'valorNo') {
          condicion[key] = this.normalizeCondiciones(condicion[key])
        }
      })
      return condicion
    })
  }

  normalizeQueryForCondiciones(condiciones) {
    const unRelayCondiciones = unRelay(condiciones)
    return this.normalizeCondiciones(unRelayCondiciones)
  }

  getCondiciones() {
    const { type } = this.props
    const method = type === 'conjunto' ? 'getCondicionesByConjuntoId' : 'getCondicionesByCampoId'
    // ApiClient.graphql(Queries.getCondicionesByConjuntoId('Q29uanVudG9Ob2RlOjE2')).then(response => {
    ApiClient.graphql(Queries[method](this.props.model.id)).then(response => {
      const { data } = response
      if (data && data.condiciones && data.condiciones.edges.length) {
        const condiciones = this.normalizeQueryForCondiciones(data.condiciones.edges)
        this.setState({ condiciones })
      } else {
        this.setState({ condiciones: [this.mockCondition()] })
      }
    })
  }

  mockCondition(group=[]) {
    const mockId = crypto.randomBytes(20).toString('hex')
    return {
      id: mockId,
      orden: group.length + 1,
      izquierda: '',
      tipoIzquierda: '',
      unidadIzquierda: '',
      derecha: '',
      tipoDerecha: '',
      unidadDerecha: '',
      valorSi: [],
      valorNo: [],
      new: true
    }
  }

  get condiciones() {
    return this.state.condiciones.sort((a, b) => {
      return a.orden > b.orden
    })
  }

  onFieldsChange(value) {
    const condicionIndex = this.condiciones.findIndex(cond => cond.id === value.id)
    if (condicionIndex + 1) {
      const condiciones = [...this.condiciones]
      condiciones[condicionIndex] = value
      this.setState({ condiciones })
    }
  }

  showModal() {
    this.setState({ visible: true })
  }

  prepareCondiciones(condiciones) {
    if (!condiciones.length) return []

    return [...condiciones].map((condicion) => {
      const newCondicion = {...condicion}
      if (newCondicion.new) {
        delete newCondicion['id']
        delete newCondicion['new']
      }
      if (newCondicion.valorSi) {
        newCondicion.valorSi = this.prepareCondiciones(newCondicion.valorSi)
      }
      if (newCondicion.valorNo) {
        newCondicion.valorNo = this.prepareCondiciones(newCondicion.valorNo)
      }
      return newCondicion
    })
  }

  handleOk() {  // TODO: Cuando agregas un campo, por defecto viene con el valorSi y valorNo seteados
    const condiciones = this.prepareCondiciones(this.condiciones)
    const payload = {
      condiciones_set: condiciones,
      identificador: this.props.model.identificador
    }
    ApiClient.post('main', `condiciones/${this.props.model.id}`, payload).then(data => {
      console.log(data) // TODO: Tratar datos
    })
  }

  handleCancel() {
    this.setState({ visible: false })
  }

  onSearch(value) {
    (value && value.length >= 3) && ApiClient.graphql(Queries.IDENTIFICADOR_SEARCH, JSON.stringify({params: value})).then(data => {
      if ('data' in data) {
        this.setState({
          dataSource: [
            ...data.data.campos.edges.map(edge => edge.node.identificador),
            ...data.data.conjuntos.edges.map(edge => edge.node.identificador)
          ]
        })
      }
    });
  }

  swapCondiciones(start, target) {
    const condiciones = [...this.condiciones]
    const condicionStart = condiciones.find(cond => cond.orden === parseInt(start, 10))
    const condicionTarget = condiciones.find(cond => cond.orden === parseInt(target, 10))
    if (condicionStart && condicionTarget) {
      condicionStart.orden = target
      condicionTarget.orden = start
    }
    this.setState({ condiciones })
  }

  onDrop(dataTransfer, data) {
    const index = parseInt(dataTransfer.getData('id'), 10)
    this.swapCondiciones(index, data)
  }

  onDragStart(dataTransfer, order) {
    dataTransfer.setData('id', order)
  }

  getFormula(condiciones) {
    let formula = ''

    condiciones.forEach(condicion => {
      let condicionArray = [
        condicion.izquierda,
        condicion.unidadIzquierda.replace('_vod', '') || '',
        condicion.tipoIzquierda.replace('_vod', '')
      ]

      if (condicion.tipoIzquierda in FormCondicion.LOGICAL_OPERATORS) {
        Array.prototype.push.apply(condicionArray, [
          condicion.derecha.replace('_vod', ''),
          condicion.unidadDerecha.replace('_vod', '') || '',
          '( ',
          `SI (${this.getFormula(condicion.valorSi)})`,
          `NO (${this.getFormula(condicion.valorNo)})`,
          ' ) ',
          condicion.tipoDerecha.replace('_vod', '')
        ])
      }

      formula += condicionArray.join(' ')
    })

    return formula
  }

  showFormula() {
    const formula = this.getFormula(this.condiciones)

    return <div>
      <code>
        <pre>{formula}</pre>
      </code>
    </div>
  }

  onClickAddButton(event) {
    const newCondicion = this.mockCondition(this.state.condiciones)
    const condiciones = [...this.state.condiciones, newCondicion]
    this.setState({ condiciones })
  }

  renderContentModal() {
    return <React.Fragment>
      <Form layout="inline">
        <Droppable>
          {Boolean(this.state.condiciones.length) && this.condiciones.map((condicion, index) => {
            return <React.Fragment key={condicion.id}>
              {index !== 0 && <Icon className="icon-guide" type="arrow-right" />}
              <FormCondicion
                key={condicion.id}
                condicion={condicion}
                group={this.condiciones}
                onDrop={this.onDrop.bind(this)}
                dataSource={this.state.dataSource}
                onSearch={this.onSearch.bind(this)}
                onDragStart={this.onDragStart.bind(this)}
                onFieldsChange={this.onFieldsChange.bind(this)}
                onRequestNewRootCondicion={this.onClickAddButton.bind(this)}
              />
            </React.Fragment>
          })}
        </Droppable>
        <Button type="primary" onClick={this.onClickAddButton.bind(this)} shape='circle' icon="plus" />
      </Form>
      <Card>
        {this.showFormula()}
      </Card>
    </React.Fragment>
  }

  render() {
    return <div>
      {/* <Button type="primary" onClick={this.showModal.bind(this)}>Open</Button> */}
      <Modal
        visible={this.state.visible}
        title="Condiciones"
        width={1000}
        onOk={this.handleOk.bind(this)}
        onCancel={this.handleCancel.bind(this)}
        footer={[
          <Button key="back" onClick={this.handleCancel.bind(this)}>Cancel</Button>,
          <Button key="submit" type="primary" loading={this.state.loading} onClick={this.handleOk.bind(this)}>Submit</Button>
        ]}>
          {this.renderContentModal()}
        </Modal>
    </div>
  }

}

export default Condiciones
