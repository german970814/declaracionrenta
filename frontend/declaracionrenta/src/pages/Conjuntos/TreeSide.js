import React, { Component } from 'react'
import { Menu } from 'antd';

const { Item, SubMenu } = Menu

export default class TreeSide extends Component {
  constructor(props) {
    super(props)

    const defaultOpen = window.localStorage.getItem('keyPath')
    this.defaultOpen = defaultOpen ? JSON.parse(defaultOpen) : []
  }

  fillItems(conjunto) {
    if (conjunto.childrenSet && conjunto.childrenSet.edges.length) {
      return <SubMenu key={conjunto.id} title={<span>{conjunto.nombre}</span>}>
        <Item key={`${conjunto.id}-raiz`}>Raiz</Item>
        {conjunto.childrenSet && conjunto.childrenSet.edges.map(conj => {
          return this.fillItems(conj.node)
        })}
      </SubMenu>
    }
    return <Item key={conjunto.id}>{conjunto.nombre}</Item>
  }

  render() {
    return <Menu
      mode="inline"
      style={{ height: '100%' }}
      onClick={this.props.onItemClick.bind(this)}
      defaultOpenKeys={this.defaultOpen}
      defaultSelectedKeys={this.props.defaultSelectedKeys || []}
      selectedKeys={this.props.defaultSelectedKeys || []}>
      {this.props.conjuntos.map((item) => {
        return this.fillItems(item.node)
      })}
    </Menu>
  }

}
