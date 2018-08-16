import React, { Component } from 'react'
import { Form, Input, Checkbox, Button } from 'antd'
import ApiClient from './../../../api';
import mutate from './../mutations'
import Queries from './../queries'

class FormConjunto extends Component {
  static layout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 4 }
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 20 }
    }
  }

  constructor(props) {
    super(props)

    this.state = {
      buttonLoading: false
    }

    this.fields = {
      nombre: {
        key: 'nombre',
        label: 'Nombre',
        help: 'Este será el nombre del conjunto',
        required: true
      },
      identificador: {
        key: 'identificador',
        label: 'Identificador',
        help: 'Con este campo, reconocerá el conjunto en cualquier lugar de la aplicación',
        required: true,
        rules: [{
          transform: (value) => {
            const form = this.props.form
            const identificador = value ? value.replace(/[\s+_+]/g, '-').replace(/^_+/g, '').toLowerCase() : value
            form.setFieldsValue({ identificador })
            return identificador
          }, message: 'Este campo es requerido'
        }],
      },
      repetible: {
        key: 'repetible',
        label: 'Repetible',
        type: 'checkbox',
        help: 'Al habilitar este campo, le das la opción al usuario de repetir las veces que necesite este conjunto'
      },
      automatico: {
        key: 'automatico',
        label: 'Automático',
        type: 'checkbox',
        help: 'Al habilitar este campo, el valor del conjunto dependerá de las condiciones establecidas',
        helpWithValue: (onClick) => <Button onClick={onClick}>Ver condiciones</Button>
      },
      requisitos: {
        key: 'requisitos',
        label: 'Requisitos',
        type: 'textarea',
        help: 'Estos serán los requisitos del usuario para llenar este conjunto'
      },
      descripcion: {
        key: 'descripcion',
        label: 'Decripción',
        type: 'textarea',
        help: 'Esta es la descripción de este conjunto'
      }
    }
  }

  getFieldDecorator(field) {
    const defaults = {
      initialValue: this.props.conjunto[field.key] || (field.type === 'checkbox' ? false : '')
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
        return <Input.TextArea rows={4} />
      default:
        return <Input placeholder={field.placeholder || ''} />
    }
  }

  handleSubmit(event) {
    event.preventDefault()
    event.stopPropagation()

    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        this.setState({ buttonLoading: true })
        const mutationName = 'conjuntoCreateUpdate'
        const conjunto = { ...values }
        if (this.props.conjunto.id) {
          conjunto.id = this.props.conjunto.id
        } else {
          conjunto.parent = this.props.conjuntoParent.id
        }
        ApiClient.graphql(...mutate(mutationName, conjunto, {
          type: 'ConjuntoNodeMutationInput',
          query: Queries.CONJUNTO_SIN_RELAY
        })).then(data => {
          this.props.onConjuntoUpdated && this.props.onConjuntoUpdated(
            data.data[mutationName], !Boolean(this.props.conjunto.id)
          )
          this.setState({ buttonLoading: false })
        })
      }
    })
  }

  render() {
    const { getFieldDecorator, getFieldError, isFieldTouched, getFieldValue } = this.props.form

    return <Form onSubmit={this.handleSubmit.bind(this)}>
      {Object.keys(this.fields).map((key, index) => {
        const field = this.fields[key]
        const fieldError = isFieldTouched(key) && getFieldError(key)
        let extra = field.help || ''

        if (
          ('helpWithValue' in field) && (getFieldValue(key) ||
          (this.props.conjunto && (key in this.props.conjunto) && this.props.conjunto[key]))
        ) {
          extra = field.helpWithValue(() => {
            this.props.onAutomaticoChange(true)
          })
        }

        return <Form.Item
          key={index}
          {...FormConjunto.layout}
          label={field.label}
          extra={extra}
          validateStatus={fieldError ? 'error' : ''}
          help={fieldError || ''}
        >
          {getFieldDecorator(key, this.getFieldDecorator(field))(this.renderField(field))}
        </Form.Item>
      })}
      <div className="edit-conjunto-footer">
        <Button style={{ marginRight: 8 }} onClick={this.props.onClose}>
          Cancelar
        </Button>
        <Button loading={this.state.buttonLoading} htmlType="submit" type="primary">Guardar</Button>
      </div>
    </Form>
  }
}

export default Form.create({
  onFieldsChange: (props, changedValues, allValues) => {
    if ('automatico' in changedValues) {
      props.onAutomaticoChange && props.onAutomaticoChange(changedValues.automatico.value)
    }
    props.onFieldsChange && props.onFieldsChange('formConjuntoError', changedValues, allValues)
  }
})(FormConjunto)
