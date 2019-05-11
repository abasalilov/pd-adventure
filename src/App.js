import React, { Component } from "react";
import { PartsSearch, PDMenu } from "./components";

const styles = {
  container: {
    margin: "2rem",
    display: "flex",
    justifyContent: "center",
    border: "solid orange 3px"
  },
  subcontainer: {
    margin: ".5rem",
    display: "flex",
    justifyContent: "space-evenly"
  },
  selectContainer: {
    width: "20rem",
    height: "20rem",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "2rem",
    flexDirection: "column",
    position: "relative",
    border: "solid orange"
  },
  content: {
    position: "absolute",
    boxShadow: "0px 8px 16px 0px rgba(0,0,0,0.2)",
    top: "10%",
    left: "50%",
    display: "flex",
    flexDirection: "column"
  }
};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selection: null,
      years: ["2019", "2018", "2017", "2016", "2015"],
      makes: ["Ford", "Toyota", "Nissan", "Gir"],
      models: ["2.0", "2.1", "2.2", "2.3"],
      option: null
    };
  }

  handleSelect = option => {
    this.setState({ option });
  };

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
    const { option } = this.state;
    return (
      <div>
        <div style={styles.container}>
          <PDMenu select={this.handleSelect} />
        </div>
        <div style={styles.subcontainer}>
          <PartsSearch option={option} />
        </div>
      </div>
    );
  }
}

export default App;
