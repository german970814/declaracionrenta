import React, { Component } from 'react'


class Droppable extends Component {
  onDragOver(event) {
    event.preventDefault()
  }

  onDrop(event) {
    // ev.dataTransfer.getData(“text”) for IE
    // const target = this.getParentElementByClass(event.target, 'draggable')
    // this.props.onDrop && this.props.onDrop(event.dataTransfer, target)
  }

  getParentElementByClass(element, className) {
    let parent = element.parentNode
    if (!parent) return null
    if (parent.classList.contains(className)) return parent
    return this.getParentElementByClass(parent, className)
  }

  render() {
    return <div
      className="droppable"
      onDrop={this.onDrop.bind(this)}
      onDragOver={this.onDragOver.bind(this)}
    >
      {this.props.children}
    </div>
  }
}

class Draggable extends Component {
  onDragStart(event, draggable) {
    // ev.dataTransfer.setData(“text/plain”,id) for IE
    this.props.onDragStart && this.props.onDragStart(event.dataTransfer)
  }

  onDrop(event) {
    this.props.onDrop && this.props.onDrop(event.dataTransfer, this.props.data)
  }

  render() {
    return <div
      draggable
      onDrop={this.onDrop.bind(this)}
      className="draggable"
      onDragStart={this.onDragStart.bind(this)}
    >
      {this.props.children}
    </div>
  }
}


export default Draggable
export {
  Droppable, Draggable
}
