import React, { Component } from "react";

const styles = {
  datumContainer: {
    margin: "1rem"
  }
};

class UserArea extends Component {
  render() {
    const { data = [{}] } = this.props;
    return Object.keys(data[0]).map((datum, idx) => {
      if (datum !== "InformationImage") {
        return (
          <div key={idx} style={styles.datumContainer}>{`${datum}: ${
            data[0][datum]
          }`}</div>
        );
      } else {
        const imageUrls = data[0][datum][0].ImageUrl;
        return imageUrls.map((url, ot) => (
          <img key={ot} src={`${url}`} alt={`${url}`} />
        ));
      }
    });
  }
}

export const UserAreaComponent = UserArea;
