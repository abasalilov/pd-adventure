import React, { Component } from "react";
import axios from "axios";
import { PartsSearch, TestControls } from "./components";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selection: null,
      years: ["2019", "2018", "2017", "2016", "2015"],
      makes: ["Ford", "Toyota", "Nissan", "Gir"],
      models: ["2.0", "2.1", "2.2", "2.3"]
    };
  }

  async handleSearch() {}

  renderList(list, handleChange) {
    return (
      <select onChange={handleChange}>
        {list.map(i => (
          <option key={i} value={i}>
            {i}
          </option>
        ))}
      </select>
    );
  }

  render() {
    return (
      <div
        style={{
          margin: "2rem",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center"
        }}
      >
        <PartsSearch />
        <TestControls />
      </div>
    );
  }
}

export default App;
