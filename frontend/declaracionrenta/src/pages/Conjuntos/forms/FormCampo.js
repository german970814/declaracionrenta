import React, { Component } from 'react'
import { Form, Collapse, Input, Checkbox, Button } from 'antd'


class FormCampo extends Component {

  constructor(props) {
    super(props)

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
        help: 'Al habilitar este campo, el valor del conjunto dependerá de las condiciones establecidas'
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
        <Form.Item
          key={'new-nombre'}
        >
          {getFieldDecorator(
            'new-nombre',
            this.getFieldDecorator(campo, this.fields.nombre))(
              this.renderField(this.fields.nombre))
          }
        </Form.Item>
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

    this.props.form.validateFields(fields, {}, (err, values) => {
      if (!err) {
        const campo = {}
        Object.keys(values).forEach(key => {
          campo[key.replace('new-', '')] = values[key]
        })
        this.props.form.resetFields(fields)
        this.props.onNewCampo && this.props.onNewCampo(campo)
      }
    })
  }

  handleSubmit(event) {
    event.preventDefault()
    event.stopPropagation()
    this.props.handleSubmit && this.props.handleSubmit('formCampoData', this.props.form)
  }

  render() {
    const { getFieldDecorator } = this.props.form
    const { campos } = this.props
    let fieldOrder = Object.keys(this.fields)
    fieldOrder = fieldOrder.slice(1, fieldOrder.length)

    return <React.Fragment>
      <Form onSubmit={this.handleSubmit.bind(this)}>
        <Collapse bordered={false}>
          {campos.map((campo, index) => {
            return <Collapse.Panel key={index} className="form-campo-collapse"
              header={
                <Form.Item
                  key={`${campo.node.id}-nombre`}
                >
                  { getFieldDecorator(
                    `${campo.node.id}-nombre`,
                    this.getFieldDecorator(campo.node, this.fields.nombre))(
                      this.renderField(this.fields.nombre))
                  }
                </Form.Item>
              }
              style={{ borderRaius: 4, border: 0, overflow: 'hidden' }}
            >
              {fieldOrder.map((field) => {
                return <Form.Item key={`${campo.node.id}-${this.fields[field].key}`}>
                  {getFieldDecorator(
                    `${campo.node.id}-${this.fields[field].key}`,
                    this.getFieldDecorator(campo.node, this.fields[field]))(
                      this.renderField(this.fields[field]))}
                </Form.Item>
              })}
            </Collapse.Panel>
          })}
        </Collapse>
      </Form>
      <Form onSubmit={this.onSubmitNewCampo.bind(this)}>
        <Collapse bordered={false}>
          {this.renderNewField(fieldOrder, getFieldDecorator)}
        </Collapse>
        <Form.Item>
          <Button type="primary" htmlType="submit">Agregar Campo</Button>
        </Form.Item>
      </Form>
    </React.Fragment>
  }

}

export default Form.create({
  onFieldsChange: (props, changedValues, allValues) => {
    props.onFieldsChange && props.onFieldsChange('formCampoError', changedValues, allValues)
  }
})(FormCampo)
