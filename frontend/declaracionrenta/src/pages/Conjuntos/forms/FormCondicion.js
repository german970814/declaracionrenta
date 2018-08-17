import React, { Component } from 'react'
import { Form, Input, Select, AutoComplete, Icon } from 'antd'
import { Draggable } from './../../../components/DragAndDrop'
import crypto from 'crypto'


/**
 * Estructura de la condicion
 *
 * {
 *   id: 1, orden: 1,
 *   izquierda: '', tipo_izquierda: '', unidad_izquierda: '',
 *   derecha: '', tipo_derecha: '', unidad_derecha: '',
 *   valor_si: [], valor_no: []
 * }, 
 *
 */

class FormCondicion extends Component {

  static WHITE = {
    '----': '(VACÍO)'
  }

  static LOGICAL_OPERATORS = {
    '>': 'MAYOR QUE',
    '<': 'MENOR QUE',
    '=': 'IGUAL QUE',
    '>=': 'MAYOR O IGUAL QUE',
    '<=': 'MENOR O IGUAL QUE',
    '<>': 'DIFERENTE QUE',
    '&&': 'Y',
    '||': 'O'
  }

  static ARITMETIC_OPERATORS = {
    '+': 'SUMA',
    '*': 'MULTIPLICACIÓN',
    '/': 'DIVISIÓN',
    '-': 'RESTA'
  }

  constructor(props) {
    super(props)

    this.parent = props.parent
    this.state = {
      isConditional_derecha: false,
      isConditional_izquierda: false
    }

    this.WHITE = FormCondicion.WHITE

    this.LOGICAL_OPERATORS = FormCondicion.LOGICAL_OPERATORS

    this.ARITMETIC_OPERATORS = FormCondicion.ARITMETIC_OPERATORS

    this.OPCIONES_OPERADORES = {
      ...this.WHITE,
      ...this.ARITMETIC_OPERATORS,
      ...this.LOGICAL_OPERATORS
    }

    this.OPCIONES_UNIDADES = {
      ...this.WHITE,
      '%': 'PORCENTAJE',
      'UVT': 'UVT'
    }
  }

  componentDidMount() {
    const { condicion } = this.props
    if (condicion) {
      if (!condicion.valor_si.length) {
        this.addNewCondicion('valor_si')
      }
      if (!condicion.valor_no.length) {
        this.addNewCondicion('valor_no')
      }
    }
  }

  mockCondition(group) {
    const mockId = crypto.randomBytes(20).toString('hex')

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

  orderByOrden(condiciones) {
    return condiciones.sort((a, b) => {
      return a.orden > b.orden
    })
  }

  isNumeric(param) {
    const { condicion } = this.props
    return !isNaN(condicion[param])
  }

  onSelectOperator(value, param) {
    this.setState({ [`isConditional_${param}`]: value in this.LOGICAL_OPERATORS })
    if (value in this.ARITMETIC_OPERATORS) {
      const { group, condicion } = this.props
      const condicionIndex = group.findIndex(cond => cond.id === condicion.id)

      if ((condicionIndex + 1) && (!group[condicionIndex + 1])) {
        console.log('deberia agregar uno nuevo')
        this.props.onRequestNewRootCondicion ? this.props.onRequestNewRootCondicion() :
        (this.props.onRequestNewCondicion && this.props.onRequestNewCondicion())
      }
    }
  }

  renderOperatorOptions(param, _options=null) {
    const { condicion } = this.props
    const { getFieldDecorator } = this.props.form
    const canCreateCondicionales = (() => {
      if (this.parent) {
        if (this.parent.parent) return false
      }
      return true
    })()
    const options = (_options ? _options : (canCreateCondicionales ? this.OPCIONES_OPERADORES : {
      ...this.WHITE, ...this.ARITMETIC_OPERATORS
    }))

    return <Form.Item>
      {getFieldDecorator(`${param}_tipo`, { initialValue: condicion[`${param}_tipo`] })(
        <Select style={{ width: this.isNumeric(param) ? 75 : 150 }} onSelect={(val) => this.onSelectOperator(val, param)}>
          {Object.keys(options).map(key => {
            return <Select.Option key={key} value={key}>{`${key}`}</Select.Option>
          })}
        </Select>
      )}
    </Form.Item>
  }

  renderValueInput(param) {
    const { condicion } = this.props
    const { getFieldDecorator } = this.props.form

    return <Form.Item>
      {getFieldDecorator(param, {
        initialValue: condicion[param],
        rules: [{required: true, message: 'Este campo es obligatorio'}]
      })(
        <AutoComplete
          dataSource={this.props.dataSource}
          onSearch={this.props.onSearch}
          placeholder="Agrega un valor aquí">
          <Input />
        </AutoComplete>
      )}
    </Form.Item>
  }

  renderOperation(izquierda=true) {
    const param = izquierda ? 'izquierda' : 'derecha'

    return <div className="operator">
      {this.renderValueInput(param)}
      {this.renderSelectDigitOptions(param)}
      {izquierda ? this.renderOperatorOptions(param) : this.renderOperatorOptions(param, {
        ...this.WHITE, ...this.ARITMETIC_OPERATORS
      })}
    </div>
  }

  renderSelectDigitOptions(param) {
    const { condicion } = this.props
    if (this.isNumeric(param)) {
      const { getFieldDecorator } = this.props.form
      const options = this.OPCIONES_UNIDADES

      return <Form.Item>
        {getFieldDecorator(`${param}_unidad`, { initialValue: condicion[`${param}_unidad`] })(
          <Select style={{ width: 75 }}>
            {Object.keys(options).map(key => {
              return <Select.Option key={key} value={key}>{`${key}`}</Select.Option>
            })}
          </Select>
        )}
      </Form.Item>
    }
    return null
  }

  addNewCondicion(attribute) {
    const condicion = { ...this.props.condicion }
    condicion[attribute].push(this.mockCondition(condicion[attribute]))
    this.props.onFieldsChange && this.props.onFieldsChange(condicion)
  }

  onNewChildCondicion(attribute, newCondicion) {
    const { condicion } = this.props
    const condicionIndex = condicion[attribute].findIndex(cond => cond.id === newCondicion.id)
    if (condicionIndex + 1) {
      const condiciones = [...condicion[attribute]]
      condiciones[condicionIndex] = newCondicion
      const condicionCopy = {...condicion}
      condicionCopy[attribute] = condiciones
      this.props.onFieldsChange && this.props.onFieldsChange(condicionCopy)
    }
  }

  render() {
    const { condicion } = this.props

    return <Draggable
      data={condicion.orden}
      onDrop={this.props.onDrop}
      onDragStart={(dt) => this.props.onDragStart && this.props.onDragStart(dt, condicion.orden)}
    >
      {this.renderOperation(true)}
      {this.state.isConditional_izquierda && this.renderOperation(false)}
      {this.state.isConditional_izquierda && <div className="condicion-content">
        <p>Valor sí</p>
        {this.orderByOrden(condicion.valor_si).map((cond, ind, array) => {
          return <React.Fragment key={ind}>
            <FormCondicionFormComponent
              key={ind}
              parent={this}
              group={array}
              condicion={cond}
              onSearch={this.props.onSearch}
              dataSource={this.props.dataSource}
              onFieldsChange={(cd) => this.onNewChildCondicion('valor_si', cd)}
              onRequestNewCondicion={() => this.addNewCondicion('valor_si')}
            />
            {((array.length > 0) && ind !== (array.length - 1)) && <Icon className="icon-guide" type="arrow-down" />}
          </React.Fragment>
        })}
        <p>Valor no</p>
        {this.orderByOrden(condicion.valor_no).map((cond, ind, array) => {
          return <React.Fragment key={ind}>
            <FormCondicionFormComponent
              key={ind}
              parent={this}
              group={array}
              condicion={cond}
              onSearch={this.props.onSearch}
              dataSource={this.props.dataSource}
              onFieldsChange={(cd) => this.onNewChildCondicion('valor_no', cd)}
              onRequestNewCondicion={() => this.addNewCondicion('valor_no')}
            />
            {((array.length > 0) && ind !== (array.length - 1)) && <Icon className="icon-guide" type="arrow-down" />}
          </React.Fragment>
        })}
      </div>}
    </Draggable>
  }
}

const FormCondicionFormComponent = Form.create({
  onFieldsChange: (props, changedValues, allValues) => {
    // this.WrappedComponent
    const partialObject = {}
    Object.keys(changedValues).forEach(el => {
      partialObject[changedValues[el].name] = changedValues[el].value
    })
    props.onFieldsChange && props.onFieldsChange(Object.assign(
      {}, props.condicion, partialObject
    ), changedValues)
  }
})(FormCondicion)

export default FormCondicionFormComponent
