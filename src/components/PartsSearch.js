import React, { Component } from "react";
import { connect } from "react-redux";
import Spinner from "react-easy-spinner";
import { Part } from "./Part";
import { AutoZone } from "./AutoZone";
import { Napa } from "./Napa";
import { withStyles } from "@material-ui/core/styles";

const AZ = "AUTOZONE";
const NAPA = "NAPA";

const settings = {
  shape: "cog",
  animation: "spin",
  time: "2s",
  duration: "infinite",
  opacity: "0.3",
  position: "inherit",
  elColor: "#e75b24"
};

const styles = theme => ({
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
    display: "flex",
    flexDirection: "row"
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
});

const overRideStyles = {
  title: {
    border: "solid orange",
    width: "50%",
    height: "60rem",
    display: "flex",
    justifyContent: "center",
    overflow: "scroll"
  }
};

class PartsSearchComponent extends Component {
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
      console.log("part", Object.keys(part));
      return (
        <div key={idx}>
          <Part part={part} />
        </div>
      );
    });
  }

  renderList(list, handleChange) {
    const { classes } = this.props;
    return (
      <select onChange={handleChange}>
        {list.map(i => (
          <option className={classes.reqOption} key={i} value={i}>
            {i}
          </option>
        ))}
      </select>
    );
  }

  render() {
    const { option, classes } = this.props;
    if (option === null) {
      return null;
    }
    return (
      <div className={classes.container}>
        <div>
          {option === AZ && <AutoZone />}
          {option === NAPA && <AutoZone />}
        </div>
        <div className="container-fluid" style={overRideStyles.title}>
          <div className={classes.row_new}>
            <div className="paragraph">Results/Errors</div>
            {this.props.pending && (
              <Spinner className={classes.spinner} {...settings} />
            )}
            {this.props.result && this.renderPartsList()}
          </div>
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

export const StyledPartsSearch = withStyles(styles)(PartsSearchComponent);

export const PartsSearch = connect(
  mapStateToProps,
  null
)(StyledPartsSearch);
