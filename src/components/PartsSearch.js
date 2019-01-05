import React, { Component } from "react";
import { connect } from "react-redux";
import { submitSearch } from "../actions";

class PartSearchComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      updateVin: false
    };

    this.handleSelection = this.handleSelection.bind(this);
    this.handleInformUser = this.handleInformUser.bind(this);
    this.handleSearchSubmit = this.handleSearchSubmit.bind(this);
    this.handleToggleVinPut = this.handleToggleVinPut.bind(this);
  }

  componentDidMount() {}

  handleSelection(name, e) {
    this.setState({ [name]: e.target.value });
  }

  handleInformUser() {
    alert("No scanning on this platform, it's just there for mocking UI ;-)");
  }

  handleSearchSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    const { searchTerm } = this.state;

    if (typeof searchTerm !== "undefined") {
      const vin = this.state.vin ? this.state.vin : "JTMZK33V576008418";
      this.props.makeSearchReq({ vin, searchTerm });
    } else {
      alert("Please enter a search term");
    }
  }

  handleToggleVinPut() {
    this.setState({ updateVin: !this.state.updateVin });
  }

  render() {
    return (
      <div style={{ border: "solid orange 2px", height: "60rem" }}>
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
              <div className="col-xs-8 text-center">Scan</div>
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
                  To search for parts, first scan vehicle VIN barcode
                </div>
                <button
                  onClick={this.handleInformUser}
                  className="btn btn-lg btn-orange-fill text-center addMargin"
                  data-id="scan"
                >
                  <img src="./assets/img/icon-scan-white.png" alt="" />
                  <span>SCAN</span>
                </button>
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
                    className="btn btn-default btn-block btn-lg btn-orange-fill "
                  >
                    Start
                  </button>
                  <div
                    data-id="scan"
                    className="btn-orange-link addMargin"
                    onClick={this.handleToggleVinPut}
                  >
                    <img src="./assets/img/icon-scan-sm.png" alt="" /> Search a
                    different VIN
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
    makeSearchReq: searchTerm => dispatch(submitSearch(searchTerm))
  };
};

export const PartsSearch = connect(
  mapStateToProps,
  mapDispatchToProps
)(PartSearchComponent);
