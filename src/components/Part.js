import React, { Component } from "react";

class PartComponent extends Component {
  render() {
    const {
      Availability,
      Description,
      Manufacturer,
      Price,
      UserArea
    } = this.props.part;
    return (
      <div style={{ border: "solid orange 2px", height: "60rem" }}>
        <div>Availability</div>
        <div>Description</div>
        <div>Manufacturer</div>
        <div>Price</div>
        <div>UserArea</div>
      </div>
    );
  }
}

export const Part = PartComponent;
