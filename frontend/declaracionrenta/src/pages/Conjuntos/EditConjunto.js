import React, { Component } from 'react'
import { Drawer, Button, Form, Tabs } from 'antd'
import FormCampo from './forms/FormCampo'
import FormConjunto from './forms/FormConjunto'
import ApiClient from './../../api';
import mutate from './mutations'
import Queries from './queries'


class EditConjunto extends Component {

  constructor(props) {
    super(props)

    this.state = {
      visible: false,
      conjunto: props.conjunto || {},
      buttonLoading: false
    }

    this.formConjunto = React.createRef();
    this.formCampo = React.createRef();
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

  onFieldsChange(type, fieldChanged, allFields) {
    const typeObject = {}
    // console.log(type)
    this.setState({ [type]: Object.keys(allFields).some((key) => {
      typeObject[key] = allFields[key].value
      return Boolean(allFields[key].errors)
    }), [`${type}_object`]: typeObject })
    console.log(typeObject)
  }

  unrelay(object) {
    function slice(obj, field) {
      const entries = Object.entries(obj)
      const position = entries.findIndex(el => el[0] === field)
      if (position >= 0) {
        const sliced = entries.slice(position, position + 1).map(entry => entry[1])
        // delete obj[field]
        return sliced ? sliced[0]: sliced
      }
      return null
    }

    Object.keys(object).forEach(field => {
      if (object[field] instanceof Object) {
        if ('edges' in object[field]) {
          const edges = slice(object[field], 'edges').map(node => {
            return node.node
          })
          object[field] = edges
        }
      }
    })
    return object
  }

  getObjectToSave() {
    return Object.assign({}, this.state.conjunto, {
      ...this.state.formConjuntoError_object
    }, {
      campos: {
        // edges: 
      }
    })
  }

  handleSubmitButton(event) {
    if (!('formConjuntoError' in this.state) && !('formCampoError' in this.state)) return
    const { formConjuntoError=false, formCampoError=false } = this.state
    const hasError = formConjuntoError && formCampoError

    if (!hasError) {
      this.setState({ buttonLoading: true })
      const conjunto = Object.assign({}, this.state.conjunto)
      delete conjunto['childrenSet']
      const data = this.unrelay(conjunto)
      ApiClient.graphql(...mutate('conjuntoCreateUpdate', data, {
          type: 'ConjuntoNodeMutationInput',
          query: Queries.CONJUNTO_SIN_RELAY
      })).then(data => {
        console.log(data)
        this.setState({ buttonLoading: false })
      })
    }
  }

  handleSubmit(event) {
    event.preventDefault()
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        console.log(values)
      }
    })
  }

  onNewCampo(value) {
    // Note: Este campo que se agrega puede ser eliminado si se recarga
    // desde el padre a this.state.conjunto
    this.state.conjunto && this.setState({
      conjunto: Object.assign({}, this.state.conjunto, {
        campos: { edges: [
          ...this.state.conjunto.campos.edges,
          { node: value }
        ] }
      })
    })
  }

  renderFormConjunto() {
    return <FormConjunto
      ref={this.formConjunto}
      onFieldsChange={this.onFieldsChange.bind(this)}
      formParent={this.props.form}
      conjunto={this.state.conjunto}
      handleSubmit={this.handleSubmit.bind(this)} />
  }

  renderFormCampos() {
    const campos = (
      Boolean(this.state.conjunto.campos) &&
      Boolean(this.state.conjunto.campos.edges.length)) ?
        this.sort(this.state.conjunto.campos.edges) : []
    return <FormCampo
      ref={this.formCampo}
      onFieldsChange={this.onFieldsChange.bind(this)}
      campos={campos}
      formParent={this.props.form}
      onNewCampo={this.onNewCampo.bind(this)}
      handleSubmit={this.handleSubmit.bind(this)} />
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
        <Form onSubmit={this.handleSubmit.bind(this)}>
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
            <Button htmlType="submit" type="primary">Guardar</Button>
          </div>
        </Form>
      </Drawer>
    </React.Fragment>
  }

}

EditConjunto.defaultProps = {
  type: 'edit'
}

export default Form.create()(EditConjunto)
