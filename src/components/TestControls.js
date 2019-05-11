import React, { Component } from "react";
import { connect } from "react-redux";
import axios from "axios";
import Spinner from "react-easy-spinner";
import { Part } from "./Part";

const headers = {
  "x-requested-with": "XMLHttpRequest",
  "x-access-token":
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI1YzFlZWFiZTM1ZGNlOTM4ZDM1NTc1ODEiLCJleHAiOjE1NzcwNjYwNDYyMTZ9.oBKZp6Snq0M09ahr7ES4BuddTgeaR3sUJ5FxygfubaM"
};

const localReq = axios.create({
  headers
});

const settings = {
  shape: "cog",
  animation: "spin",
  time: "2s",
  duration: "infinite",
  opacity: "0.3",
  position: "inherit",
  elColor: "#e75b24"
};

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
    border: "solid orange 2px"
  },
  title: {
    border: "solid orange",
    width: "50%",
    height: "60rem",
    display: "flex",
    justifyContent: "center",
    overflow: "scroll"
  },
  spinner: {
    border: "solid red 3px",
    width: "30rem !important"
  },
  row_new: {
    width: "50rem"
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
  }

  renderPartsList() {
    return this.props.parts.map((part, idx) => {
      return (
        <div key={idx}>
          <Part part={part} />
        </div>
      );
    });
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

  render() {
    return (
      <div className="container-fluid" style={style.title}>
        <div style={style.row_new}>
          <div className="paragraph">Results/Errors</div>
          {this.props.pending && (
            <Spinner style={style.spinner} {...settings} />
          )}
          {this.props.result && this.renderPartsList()}
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  const {
    search: { result, pending, parts }
  } = state;
  return {
    result,
    pending,
    parts
  };
};

export const TestControls = connect(
  mapStateToProps,
  null
)(TestControlComponent);
