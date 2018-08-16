import React, { Component } from 'react'
import { Modal, Button, Form, Input, Select, Checkbox, Card } from 'antd'
import ApiClient from './../../api';
import Queries from './queries'
import { Droppable } from './../../components/DragAndDrop'
import FormCondicion from './forms/FormCondicion'


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
      condiciones: [
        // {
        //   id: 1, izquierda: '', izquierda_tipo: '', derecha_unidad: '', izquierda_unidad: '', orden: 1, valor_si: [], valor_no: [], derecha: '', derecha_tipo: ''
        // },
        // {
        //   id: 2, izquierda: '', izquierda_tipo: '', derecha_unidad: '', izquierda_unidad: '', orden: 3, valor_si: [], valor_no: [], derecha: '', derecha_tipo: ''
        // },
        // {
        //   id: 3, izquierda: '', izquierda_tipo: '', derecha_unidad: '', izquierda_unidad: '', orden: 4, valor_si: [], valor_no: [], derecha: '', derecha_tipo: ''
        // },
        // {
        //   id: 4, izquierda: '', izquierda_tipo: '', derecha_unidad: '', izquierda_unidad: '', orden: 5, valor_si: [], valor_no: [], derecha: '', derecha_tipo: ''
        // },
        // {
        //   id: 5, izquierda: '', izquierda_tipo: '', derecha_unidad: '', izquierda_unidad: '', orden: 6, valor_si: [], valor_no: [], derecha: '', derecha_tipo: ''
        // },
        // {
        //   id: 6, izquierda: '', izquierda_tipo: '', derecha_unidad: '', izquierda_unidad: '', orden: 7, valor_si: [], valor_no: [], derecha: '', derecha_tipo: ''
        // },
        // {
        //   id: 7, izquierda: '', izquierda_tipo: '', derecha_unidad: '', izquierda_unidad: '', orden: 8, valor_si: [], valor_no: [], derecha: '', derecha_tipo: ''
        // },
        // {
        //   id: 8, izquierda: 'segundo', izquierda_tipo: '', derecha_unidad: '', izquierda_unidad: '', orden: 9, valor_si: [], valor_no: [], derecha: '', derecha_tipo: ''
        // }
      ]
    }
  }

  componentDidMount() {
    if (!Boolean(this.state.condiciones.length)) {
      this.setState({ condiciones: [this.mockCondition()] })
    }
  }

  mockCondition(group=[]) {
    let mockId = ''
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwzyx0123456789'
    for (let i=0; i < 15; i++) {
      mockId += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    return {
      id: mockId,
      orden: group.length + 1,
      izquierda: '',
      izquierda_tipo: '',
      izquierda_unidad: '',
      derecha: '',
      derecha_tipo: '',
      derecha_unidad: '',
      valor_si: [],
      valor_no: []
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

  handleInputChange(event) {
    const target = event.target;
    this.setState({
      [target.name]: Object.assign(this.state[target.name], {
          value: target.type === 'checkbox' ? target.checked : target.value
      })
    })
    // this.validate(this.state[target.name]);
    this.state[target.name].onChange && this.state[target.name].onChange(
      this.state[target.name].value, this.state[target.name]
    );
  }

  showModal() {
    this.setState({ visible: true })
  }

  handleOk() {

  }

  handleCancel() {
    this.setState({ visible: false })
  }

  renderField(field, props={}) {
    switch (field.type) {
      case 'checkbox':
        return <Checkbox {...props}>{field.placeholder || ''}</Checkbox>
      case 'textarea':
        return <Input.TextArea rows={4} {...props} />
      default:
        return <Input placeholder={field.placeholder || ''} {...props} />
    }
  }

  renderSelectOpciones(condicion, izquierda=true) {
    const { getFieldDecorator } = this.props.form
    const options = izquierda ? this.OPCIONES_IZQUIERDA : this.OPCIONES_DERECHA
    return getFieldDecorator(`type-${condicion}`, { initialValue: '' })(
      <Select style={{ width: 150 }}>
        {Object.keys(options).map(key => {
          return <Select.Option key={key} value={key}>{`(${key}) ${options[key]}`}</Select.Option>
        })}
      </Select>
    )
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

  showFormula() {
    let formula = ''

    this.condiciones.forEach(condicion => {
      formula += `${condicion.izquierda} ${condicion.izquierda_unidad || ''} ${condicion.izquierda_tipo} `
    })
    return <div><code><pre>{formula}</pre></code></div>
  }

  onClickAddButton(event) {
    this.setState({
      condiciones: [...this.state.condiciones, this.mockCondition(this.state.condiciones)]
    })
  }

  renderContentModal() {
    return <React.Fragment>
      <Form layout="inline">
        <Droppable>
          {Boolean(this.state.condiciones.length) && this.condiciones.map((condicion, index) => {
            return <FormCondicion
              key={condicion.id}
              condicion={condicion}
              group={this.condiciones}
              onDrop={this.onDrop.bind(this)}
              dataSource={this.state.dataSource}
              onSearch={this.onSearch.bind(this)}
              onDragStart={this.onDragStart.bind(this)}
              onFieldsChange={this.onFieldsChange.bind(this)}
              />
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
