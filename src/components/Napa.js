import React, { Component } from "react";
import { connect } from "react-redux";
import { submitNapaSearch } from "../actions";

class NapaSearchComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      updateVin: false
    };

    this.handleSelection = this.handleSelection.bind(this);
    this.handleInformUser = this.handleInformUser.bind(this);
    this.handleSearchSubmit = this.handleSearchSubmit.bind(this);
    this.handleToggleVinPut = this.handleToggleVinPut.bind(this);
    this.handleQuickSearch = this.handleQuickSearch.bind(this);
  }

  componentDidMount() {}

  handleSelection(name, e) {
    this.setState({ [name]: e.target.value });
  }

  handleInformUser() {
    alert("No scanning on this platform, it's just there for testing APIs ;-)");
  }

  handleSearchSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    const { searchTerm } = this.state;

    if (typeof searchTerm !== "undefined") {
      const vin = this.state.vin ? this.state.vin : "JTMZK33V576008418";
      this.props.makeNapaSearchReq({ vin, searchTerm });
    } else {
      alert("Please enter a search term");
    }
  }

  handleToggleVinPut() {
    this.setState({ updateVin: !this.state.updateVin });
  }

  handleQuickSearch(e) {
    e.preventDefault();
    e.stopPropagation();
    const vin = this.state.vin ? this.state.vin : "JTMZK33V576008418";
    this.props.makeNapaSearchReq({ vin, searchTerm: "Brake Caliper - Front" });
  }

  render() {
    return (
      <div style={{ border: "solid #001489 2px", height: "60rem" }}>
        <div>
          <div className="container-fluid">
            <div className="row">
              <div className="col-xs-2" data-id="cancel">
                <img
                  data-id="cancel"
                  alt="chevron"
                  src="./assets/img/icon-chevron-down.png"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="error-container">
          <div className="msg" />
        </div>
        <div className="content-container">
          <div className="container-fluid">
            <div className="row" data-id="scan-container">
              <div className="col-xs-12 text-center">
                <div
                  data-id="header"
                  className={this.state.vehicle ? "vehicleOn" : "vehicleOff"}
                >
                  No vehicle chosen.
                </div>
                <div data-id="paragraph" className="paragraph">
                  To search for parts, first enter vehicle VIN
                </div>
              </div>
            </div>
            <div className="row" data-id="vehicle-container">
              <div className="col-xs-12">
                <div className={this.props.pending ? "lookup-msg" : "hide-msg"}>
                  <i className="fa fa-spin fa-cog" />
                  Looking up vehicle information
                </div>
                <div
                  className="form-group addMargin"
                  data-id="part-input-container"
                >
                  <input
                    type="text"
                    className="form-control"
                    onChange={e => this.handleSelection("searchTerm", e)}
                    id="part"
                    name="part"
                    value={this.state.searchTerm}
                    placeholder="Enter Part Name"
                    required
                  />
                </div>
                <div data-id="details" />
              </div>
            </div>
            <div className="row" data-id="search-content">
              <div className="col-xs-12">
                <form data-id="start-search">
                  <button
                    onClick={e => this.handleSearchSubmit(e)}
                    className="btn btn-default btn-block btn-lg btn-blue-fill "
                  >
                    Start
                  </button>
                  <div
                    data-id="scan"
                    className="btn-blue-link addMargin"
                    onClick={this.handleToggleVinPut}
                  >
                    Search a different VIN
                  </div>
                  {this.state.updateVin ? (
                    <div>
                      <input
                        type="text"
                        className="form-control"
                        onChange={e => this.handleSelection("vin", e)}
                        id="part"
                        name="part"
                        value={this.state.vin}
                        placeholder="Enter a Vin"
                        required
                      />
                    </div>
                  ) : (
                    ""
                  )}
                  <button
                    onClick={e => this.handleQuickSearch(e)}
                    className="btn btn-default btn-block btn-lg btn-blue-fill "
                  >
                    Simple Search (predefined)
                  </button>
                </form>
              </div>
            </div>
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

const mapDispatchToProps = dispatch => {
  return {
    makeNapaSearchReq: searchTerm => dispatch(submitNapaSearch(searchTerm))
  };
};

export const Napa = connect(
  mapStateToProps,
  mapDispatchToProps
)(NapaSearchComponent);
