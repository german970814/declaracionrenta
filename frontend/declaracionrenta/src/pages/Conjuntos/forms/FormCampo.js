import React, { Component } from 'react'
import { Form, Collapse, Input, Checkbox, Button, Col, Row } from 'antd'
import ApiClient from './../../../api';
import mutate from './../mutations'
import Queries from './../queries'

class FormCampo extends Component {

  constructor(props) {
    super(props)

    this.state = {
      buttonLoading: false
    }

    this.fields = {
      nombre: {
        key: 'nombre',
        placeholder: 'Nombre',
        help: 'Este será el nombre del conjunto',
        required: true
      },
      identificador: {
        key: 'identificador',
        placeholder: 'Identificador',
        help: 'Con este campo, reconocerá el conjunto en cualquier lugar de la aplicación'
      },
      numerico: {
        key: 'numerico',
        placeholder: 'Numérico',
        type: 'checkbox',
        help: 'Al habilitar este campo, le das la opción al usuario de repetir las veces que necesite este conjunto'
      },
      descripcion: {
        key: 'descripcion',
        placeholder: 'Decripción',
        type: 'textarea',
        help: 'Esta es la descripción de este conjunto'
      },
      automatico: {
        key: 'automatico',
        placeholder: 'Automático',
        type: 'checkbox',
        help: 'Al habilitar este campo, el valor del conjunto dependerá de las condiciones establecidas',
        helpWithValue: (onClick) => <Button onClick={onClick}>Ver condiciones</Button>
      },
      orden: {
        key: 'orden',
        placeholder: 'Orden',
        type: 'number',
        help: 'Estos serán los requisitos del usuario para llenar este conjunto'
      }
    }
  }

  get campoStruct () {
    return {
      nombre: '',
      identificador: '',
      numerico: false,
      descripcion: '',
      orden: '',
      automatico: false
    }
  }

  getFieldDecorator(campo, field) {
    const defaults = {
      initialValue: campo[field.key] || (field.type === 'checkbox' ? false : '')
    }
    const rules = field.rules ? field.rules : []

    if (field.type === 'checkbox') {
      defaults['valuePropName'] = 'checked'
    }

    return {
      rules: [
        { required: field.required || false, message: 'Este campo es requerido' },
        ...rules
      ],
      ...defaults
    }
  }

  renderField(field) {
    switch (field.type) {
      case 'checkbox':
        return <Checkbox >{field.placeholder || ''}</Checkbox>
      case 'textarea':
        return <Input.TextArea placeholder={field.placeholder || ''} rows={4} />
      default:
        return <Input style={{ backgroundColor: '#f7f7f7' }} placeholder={field.placeholder || ''} />
    }
  }

  renderHiddenField() {
    return <input type="hidden" />
  }

  getDuplicatedCampo() {
    const campos = this.props.campos
    return {
      ...this.campoStruct,
      orden: (campos && campos.length) ? campos.length + 1 : 1
    }
  }

  renderNewField(fieldOrder, getFieldDecorator) {
    const campo = this.getDuplicatedCampo()

    return <Collapse.Panel className="form-campo-collapse"
      header={
        <Row gutter={12}>
          <Col span={22}>
            <Form.Item
              key={'new-nombre'}
            >
              {getFieldDecorator(
                'new-nombre',
                this.getFieldDecorator(campo, this.fields.nombre))(
                  this.renderField(this.fields.nombre))
              }
            </Form.Item>
          </Col>
          <Col span={2}>
            <Form.Item>
              <Button type="primary" onClick={this.onSubmitNewCampo.bind(this)}>+</Button>
            </Form.Item>
          </Col>
        </Row>
      }
      style={{ borderRaius: 4, border: 0, overflow: 'hidden' }}
    >
      {fieldOrder.map((field) => {
        return <Form.Item key={`new-${this.fields[field].key}`}>
          {getFieldDecorator(
            `new-${this.fields[field].key}`,
            this.getFieldDecorator(campo, this.fields[field]))(
              this.renderField(this.fields[field]))}
        </Form.Item>
      })}
    </Collapse.Panel>
  }

  onSubmitNewCampo(event) {
    event.preventDefault()
    event.stopPropagation()
    const fields = Object.keys(this.fields).map(field => `new-${field}`)

    this.props.formParent.validateFields(fields, {}, (err, values) => {
      if (!err) {
        const campo = {}
        Object.keys(values).forEach(key => {
          campo[key.replace('new-', '')] = values[key]
        })
        campo.conjunto = this.props.conjunto.id
        this.props.formParent.resetFields(fields)
        this.props.onNewCampo && this.props.onNewCampo(campo)
      }
    })
  }

  handleSubmit(event) {
    event.preventDefault()
    event.stopPropagation()

    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        const fields = []
        const ids = Object.keys(values).filter(key => key.endsWith('-id'))

        ids.forEach(id => {
          const campo = {}
          const campoFields = Object.keys(values).filter(key => key.startsWith(values[id]))
          campoFields.forEach(field => {
            campo[field.replace(`${values[id]}-`, '')] = values[field]
          })
          fields.push(campo)
        })


        this.setState({ buttonLoading: true })
        const mutationName = 'conjuntoCreateUpdate'
        const conjunto = Object.assign({}, this.props.conjunto, {
          campos: fields
        })

        ApiClient.graphql(...mutate(mutationName, conjunto, {
          type: 'ConjuntoNodeMutationInput',
          query: Queries.CONJUNTO_SIN_RELAY
        })).then(data => {
          this.props.onCamposUpdated && this.props.onCamposUpdated()
          this.setState({ buttonLoading: false })
        })
      }
    })
  }

  renderFormNewCampo() {
    const { getFieldDecorator } = this.props.formParent
    let fieldOrder = Object.keys(this.fields)
    fieldOrder = fieldOrder.slice(1, fieldOrder.length)
  
    return <Collapse bordered={false}>
      {this.renderNewField(fieldOrder, getFieldDecorator)}
    </Collapse>
  }

  render() {
    const { getFieldDecorator, getFieldValue } = this.props.form
    const { campos } = this.props
    let fieldOrder = Object.keys(this.fields)
    fieldOrder = fieldOrder.slice(1, fieldOrder.length)

    return <React.Fragment>
      <Form onSubmit={this.handleSubmit.bind(this)}>
        <Collapse bordered={false}>
          {campos.map((campo, index) => {
            const id = campo.node.id || index
            return <Collapse.Panel key={index} className="form-campo-collapse"
              header={
                <div>
                  <Form.Item key={`${id}-nombre`}>
                    { getFieldDecorator(
                      `${id}-nombre`,
                      this.getFieldDecorator(campo.node, this.fields.nombre))(
                        this.renderField(this.fields.nombre))
                    }
                  </Form.Item>
                  <Form.Item key={`${id}-id`}>
                    {getFieldDecorator(`${id}-id`, { initialValue: id })(
                      this.renderHiddenField()
                    )}
                  </Form.Item>
                </div>
              }
              style={{ borderRaius: 4, border: 0, overflow: 'hidden' }}
            >
              {fieldOrder.map((field) => {
                let extra = field.help || ''

                if (
                  ('helpWithValue' in this.fields[field]) && ((getFieldValue(`${id}-${this.fields[field].key}`) === undefined &&
                    (campo && (field in campo) && campo[field])) ||
                    getFieldValue(`${id}-${this.fields[field].key}`))
                ) {
                  extra = this.fields[field].helpWithValue(() => {
                    this.props.onAutomaticoChange(true, campo)
                  })
                }

                return <Form.Item key={`${id}-${this.fields[field].key}`} extra={extra}>
                  {getFieldDecorator(
                    `${id}-${this.fields[field].key}`,
                    this.getFieldDecorator(campo.node, this.fields[field]))(
                      this.renderField(this.fields[field]))}
                </Form.Item>
              })}
            </Collapse.Panel>
          })}
        </Collapse>
        {this.renderFormNewCampo()}
        <div className="edit-conjunto-footer">
          <Button style={{ marginRight: 8 }} onClick={this.props.onClose}>
            Cancelar
            </Button>
          <Button loading={this.state.buttonLoading} htmlType="submit" type="primary">Guardar</Button>
        </div>
      </Form>
    </React.Fragment>
  }

}

export default Form.create({
  onFieldsChange: (props, changedValues, allValues) => {
    props.onFieldsChange && props.onFieldsChange('formCampoError', changedValues, allValues)
  }
})(FormCampo)
