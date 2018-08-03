import React, { Component } from 'react'
import { Drawer, Button, Form, Input, Checkbox, Tabs } from 'antd'
import FormCampo from './forms/FormCampo'


class EditConjunto extends Component {

  constructor(props) {
    super(props)

    this.state = {
      visible: false,
      conjunto: props.conjunto || {}
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
        help: 'Al habilitar este campo, el valor del conjunto dependerá de las condiciones establecidas'
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

  componentDidUpdate(prevProps) {
    if (prevProps.conjunto !== this.props.conjunto) {
      this.setState({ conjunto: this.props.conjunto })
    }
  }

  sort(campos) {
    return campos.sort((a, b) => {
      return a.node.orden > b.node.orden
    })
  }

  showDrawer() {
    this.setState({ visible: true })
  }

  onClose() {
    this.props.onClose && this.props.onClose()
    this.setState({ visible: false })
  }

  handleSubmit() {

  }

  renderFormConjunto() {
    const { getFieldDecorator, getFieldError, isFieldTouched } = this.props.form
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 4 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 20 }
      }
    }

    return <Form onSubmit={this.handleSubmit.bind(this)}>
      {Object.keys(this.fields).map((key, index) => {
        const field = this.fields[key]
        const fieldError = isFieldTouched(key) && getFieldError(key)

        return <Form.Item
          key={index}
          {...formItemLayout}
          label={field.label}
          extra={field.help || ''}
          validateStatus={fieldError ? 'error' : ''}
          help={fieldError || ''}
          >
          {getFieldDecorator(key, this.getFieldDecorator(field))(this.renderField(field))}
        </Form.Item>
      })}
    </Form>
  }

  renderFormCampos() {
    if (Boolean(this.state.conjunto.campos) && Boolean(this.state.conjunto.campos.edges.length)) {
      const campos = this.sort(this.state.conjunto.campos.edges)
      return <FormCampo campos={campos} />
    }
    // const campoStruct = {
    //   nombre: '',
    //   identificador: '',
    //   numerico: false,
    //   descripcion: '',
    //   orden: '',
    //   automatico: false
    // }

    // const { getFieldDecorator, getFieldError, isFieldTouched } = this.props.form
    // if (Boolean(this.state.conjunto.campos.edges) && Boolean(this.state.conjunto.campos.edges.length)) {
    //   const campos = this.sort(this.state.conjunto.campos)

    // }
    // console.log(campos)
    // return <Form onSubmit={this.handleSubmit.bind(this)}>

    // </Form>
  }

  getFieldDecorator(field) {
    const defaults = {
      initialValue: this.state.conjunto[field.key] || (field.type === 'checkbox' ? false : '')
    }
    const rules = field.rules ? field.rules : []

    if (field.type === 'checkbox') {
      defaults['valuePropName'] = 'checked'
    }

    return {
      rules: [
        {required: field.required || false, message: 'Este campo es requerido'},
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

  render() {
    const { type } = this.props

    return <React.Fragment>
      <Button icon="edit" onClick={this.showDrawer.bind(this)} style={{backgroundColor: 'transparent', border: 0}} />
      <Drawer
        title={type === 'edit' ? 'Editar Conjunto' : 'Crear Conjunto'}
        width={720}
        placement="right"
        onClose={this.onClose.bind(this)}
        maskClosable={false}
        visible={this.state.visible}
        style={{
          height: 'calc(100% - 55px)',
          overflow: 'auto', paddingBottom: 53
        }}>
        <Tabs defaultActiveKey="0" tabPosition="top" style={{ height: 'auto' }}>
          <Tabs.TabPane key="0" tab="Conjunto">
            {this.renderFormConjunto()}
          </Tabs.TabPane>
          <Tabs.TabPane key="1" tab="Campos">
            {this.renderFormCampos()}
          </Tabs.TabPane>
        </Tabs>
        <div className="edit-conjunto-footer">
          <Button style={{ marginRight: 8 }} onClick={this.onClose.bind(this)}>
            Cancelar
          </Button>
          <Button onClick={this.onClose.bind(this)} type="primary">Guardar</Button>
        </div>
      </Drawer>
    </React.Fragment>
  }

}

EditConjunto.defaultProps = {
  type: 'edit'
}

export default Form.create()(EditConjunto)
