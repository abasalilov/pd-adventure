import React, { Component } from "react";
import logo from "./logo.svg";
import axios from "axios";
import "./App.css";

const headers = {
  "x-requested-with": "XMLHttpRequest",
  "x-access-token":
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI1YzFlZWFiZTM1ZGNlOTM4ZDM1NTc1ODEiLCJleHAiOjE1NzcwNjYwNDYyMTZ9.oBKZp6Snq0M09ahr7ES4BuddTgeaR3sUJ5FxygfubaM"
};

const localReq = axios.create({
  headers
});

const style = {
  select: {
    border: "solid orange 1px",
    margin: "3rem",
    fontSize: "1rem",
    width: "25%"
  },
  reqOption: {
    border: "solid orange 1px",
    margin: "3rem",
    fontSize: "1rem"
  },
  year: {
    margin: "1rem",
    fontSize: "1rem",
    display: "flex",
    flexDirection: "row",
    justifyContent: "center"
  },
  container: {
    width: "35%",
    margin: "0 auto",
    minWidth: "300px"
  }
};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selection: null,
      years: ["2019", "2018", "2017", "2016", "2015"],
      makes: ["Ford", "Toyota", "Nissan", "Gir"],
      models: ["2.0", "2.1", "2.2", "2.3"]
    };
    this.handleSelection = this.handleSelection.bind(this);
    this.handleSearchByVinClick = this.handleSearchByVinClick.bind(this);
  }

  async componentDidMount() {
    const one = await localReq.post("http://localhost:3001/search/autozone", {
      searchTerm: "OIL FILTER",
      vin: "JTMZK33V576008418",
      azCategory: "",
      user: {
        api: {
          expires: "2019-12-23T01:54:06.216Z",
          token:
            "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI1YzFlZWFiZTM1ZGNlOTM4ZDM1NTc1ODEiLCJleHAiOjE1NzcwNjYwNDYyMTZ9.oBKZp6Snq0M09ahr7ES4BuddTgeaR3sUJ5FxygfubaM"
        },
        providers: ["autozone"],
        autozone: { phone: "6023312706", pin: "764505" },
        partsAuthority: {},
        advanceAuto: {},
        __v: 0,
        password:
          "$2b$10$IVbzwQO/Ma3iODdunVe/P.d275Wf0NKSQz887/YA3n.b4SSTDnO6K",
        email: "alek@aleks.co",
        name: "Aleks",
        mode: "LIVE",
        _id: "5c1eeabe35dce938d3557581"
      }
    });

    console.log("one", one);
  }

  renderList(list, handleChange) {
    return (
      <select onChange={handleChange}>
        {list.map(i => (
          <option style={style.reqOption} key={i} value={i}>
            {i}
          </option>
        ))}
      </select>
    );
  }

  handleSelection(name, e) {
    this.setState({ [name]: e.target.value }, () =>
      console.log("worked!", this.state)
    );
  }

  handleSearchByVinClick() {}

  render() {
    return (
      <div className="App">
        <div style={style.container}>
          <div> Select a type of search request to test</div>
          <select
            style={style.select}
            onChange={e => this.handleSelection("selection", e)}
          >
            <option value="vin">Vin</option>
            <option value="ymm">YMM</option>
            <option defaultValue="part" value="part">
              Part #
            </option>
            <option value="key">Keyword by Vin</option>
          </select>
          {this.state.selection === "vin" && (
            <div style={style.reqOption}>
              <div>Select variables:</div>
              <button onClick={this.handleSearchByVinClick}>click!</button>
            </div>
          )}
          {this.state.selection === "ymm" && (
            <div style={style.year}>
              <div>Year:</div>
              {this.renderList(this.state.years, e =>
                this.handleSelection("year", e)
              )}
            </div>
          )}
          {this.state.selection === "part" && (
            <div style={style.reqOption}>
              <input
                type={"text"}
                placeholder={"enter part #"}
                value={this.state.text}
                onChange={e => this.handleSelection("text", e)}
              />
            </div>
          )}
          {this.state.selection === "key" && (
            <div style={style.reqOption}>
              <input
                type={"text"}
                placeholder={"enter key #"}
                value={this.state.keyText}
                onChange={e => this.handleSelection("keyText", e)}
              />
            </div>
          )}
          {!!this.state.year && (
            <div style={style.year}>
              <div>Make:</div>
              {this.renderList(this.state.makes, e =>
                this.handleSelection("make", e)
              )}
            </div>
          )}
          {!!this.state.make && (
            <div style={style.year}>
              <div>Model:</div>
              {this.renderList(this.state.models, e =>
                this.handleSelection("model", e)
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default App;
