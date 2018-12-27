import React, { Component } from "react";
import axios from "axios";

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
    border: "solid blue 2px"
  },
  title: {
    border: "solid blue",
    width: "50%",
    height: "60rem",
    display: "flex",
    justifyContent: "center"
  }
};

class TestControlComponent extends Component {
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
    // const one = await localReq.post("http://localhost:3001/search/autozone", {
    //   searchTerm: "OIL FILTER",
    //   vin: "JTMZK33V576008418",
    //   azCategory: "",
    //   user: {
    //     api: {
    //       expires: "2019-12-23T01:54:06.216Z",
    //       token:
    //         "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI1YzFlZWFiZTM1ZGNlOTM4ZDM1NTc1ODEiLCJleHAiOjE1NzcwNjYwNDYyMTZ9.oBKZp6Snq0M09ahr7ES4BuddTgeaR3sUJ5FxygfubaM"
    //     },
    //     providers: ["autozone"],
    //     autozone: { phone: "6023312706", pin: "764505" },
    //     partsAuthority: {},
    //     advanceAuto: {},
    //     __v: 0,
    //     password:
    //       "$2b$10$IVbzwQO/Ma3iODdunVe/P.d275Wf0NKSQz887/YA3n.b4SSTDnO6K",
    //     email: "alek@aleks.co",
    //     name: "Aleks",
    //     mode: "LIVE",
    //     _id: "5c1eeabe35dce938d3557581"
    //   }
    // });
    // console.log("one", one);
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
      <div className="container-fluid" style={style.title}>
        <div className="row">
          <div className="paragraph">Results/Errors</div>
        </div>
      </div>
    );
  }
}

export const TestControls = TestControlComponent;
