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
      conjunto: props.conjunto || {}
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
    this.setState({ [type]: Object.keys(allFields).some((key) => {
      return Boolean(allFields[key].errors)
    }) })
  }

  handleSubmitButton(event) {
    if (!('formConjuntoError' in this.state) && !('formCampoError' in this.state)) return
    const { formConjuntoError=false, formCampoError=false } = this.state
    const hasError = formConjuntoError && formCampoError

    if (!hasError) {
      console.log(this.state.conjunto)
      // ApiClient.graphql(...mutate('campoCreateUpdate', this.state.conjunto, {
      //     type: 'ConjuntoNodeMutationInput',
      //     query: Queries.CONJUNTO_CON_CHILDREN
      // })).then(data => {console.log(data)})
    }
  }

  handleSubmit(type, form, fields=[]) {
    console.log(form);
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
          <Button onClick={this.handleSubmitButton.bind(this)} type="primary">Guardar</Button>
        </div>
      </Drawer>
    </React.Fragment>
  }

}

EditConjunto.defaultProps = {
  type: 'edit'
}

export default Form.create()(EditConjunto)
