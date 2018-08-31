import React, { Component } from 'react'
import { Drawer, Button, Form, Tabs } from 'antd'
import FormCampo from './forms/FormCampo'
import FormConjunto from './forms/FormConjunto'
import Condiciones from './Condiciones'


class EditConjunto extends Component {

  constructor(props) {
    super(props)

    const conjunto = props.conjunto || {}
    this.state = {
      visible: false,
      conjunto: conjunto,
      buttonLoading: false,
      showTabCampos: conjunto.automatico || false
    }

    this.condicionesModal = React.createRef()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.conjunto !== this.props.conjunto) {
      this.setState({
        conjunto: this.props.conjunto,
        showTabCampos: !this.props.conjunto.automatico || false
      })
    }

    if ((prevProps.conjunto && this.props.conjunto) &&
      (prevProps.conjunto.id && !this.props.conjunto.id))
    {
      this.setState({ visible: true })
    }
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

  showDrawer() {
    this.setState({ visible: true })
  }

  onClose() {
    this.props.onClose && this.props.onClose()
    this.setState({ visible: false })
  }

  /**
   * Unrelay es una función hecha para deshacer la forma como relay envía
   * los objetos luego de una llamada a la api de Django y GraphQL. Lo que hace
   * basicamente la función es quitar las keys con valores de `node` y `edges`
   * y subir su contenido un nivel de acuerdo a la estructura donde se encuentren
   * 
   * @param {Object} object Objeto al cual se le va a practicar el unrelay
   */
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

  /**
   * Función que recibe un campo nuevo, el cuál es asignado y guardado
   * siguiendo la estructura de relay
   * 
   * @param {Object} value El nuevo campo que se va a agregar
   */
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

  /**
   * Callback para realizar una acción una vez el conjunto seleccionado
   * fue actualizado desde el servidor. Lo que hace es actualizar
   * el conjunto del estado para re-renderizar lo necesario
   * 
   * @param {Object} conjuntoUpdated El conjunto que se actualizó
   */
  onConjuntoUpdated(conjuntoUpdated, isNew=false) {
    // Actualiza los datos del conjunto
    // Esto funcionará siempre y cuando en el query de la mutación
    // no se retornen los campos, de ser así, dado a la estructura
    // usada por relay, el comportamiento no será el deseado
    this.setState({
      conjunto: Object.assign({}, this.state.conjunto, {
        ...conjuntoUpdated
      })
    });

    (isNew && this.props.onConjuntoUpdate) && this.props.onConjuntoUpdate(
      this.state.conjunto.id
    )
  }

  onCamposUpdated() {
    this.props.onConjuntoUpdate && this.props.onConjuntoUpdate(this.state.conjunto.id)
  }

  onAutomaticoConjuntoChange(value, modal=true) {
    this.setState({ showTabCampos: !value })
    if (this.condicionesModal.current && value && modal) {
      this.condicionesModal.current.showModal()
    }
  }

  renderCondiciones() {
    return <Condiciones
      ref={this.condicionesModal}
      form={{...this.props.form}}
      model={this.state.conjunto} />
  }

  renderFormConjunto() {
    const conjuntoParent = this.props.conjuntoParent ? this.props.conjuntoParent.conjunto : {}
    return <FormConjunto
      onClose={this.onClose.bind(this)}
      conjuntoParent={conjuntoParent}
      onConjuntoUpdated={this.onConjuntoUpdated.bind(this)}
      onAutomaticoChange={this.onAutomaticoConjuntoChange.bind(this)}
      conjunto={this.state.conjunto} />
  }

  renderFormCampos() {
    const campos = (
      Boolean(this.state.conjunto.campos) &&
      Boolean(this.state.conjunto.campos.edges.length)) ?
        this.sort(this.state.conjunto.campos.edges) : []

    return <FormCampo
      campos={campos}
      formParent={this.props.form}
      onClose={this.onClose.bind(this)}
      onCamposUpdated={this.onCamposUpdated.bind(this)}
      conjunto={this.state.conjunto}
      onNewCampo={this.onNewCampo.bind(this)} />
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
        {this.renderCondiciones()}
        <Tabs defaultActiveKey="0" tabPosition="top" style={{ height: 'auto' }}>
          <Tabs.TabPane key="0" tab="Conjunto">
            {this.renderFormConjunto()}
          </Tabs.TabPane>
          {(this.state.conjunto.id && this.state.showTabCampos) && <Tabs.TabPane key="1" tab="Campos">
            {this.renderFormCampos()}
          </Tabs.TabPane>}
        </Tabs>
      </Drawer>
    </React.Fragment>
  }

}

EditConjunto.defaultProps = {
  type: 'edit'
}

export default Form.create()(EditConjunto)
