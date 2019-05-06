import React, { Component } from "react";
import { UserAreaComponent } from "./UserAreaComponent";

const styles = {
  partContainer: {
    margin: "1rem"
  },
  simpleData: {
    margin: "1rem"
  },
  priceBlock: {
    margin: "1rem"
  },
  coreCost: {
    margin: "1rem"
  },
  priceSideBySide: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-around"
  },
  uaBlock: {
    margin: "1rem"
  },
  box: {
    width: "1rem",
    height: "1rem",
    backgroundColor: "orange",
    marginRight: "1rem"
  },
  sBs: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center"
  },
  separator: {
    height: "2px",
    backgroundColor: "green",
    margin: "2rem 0",
    width: "100%"
  }
};

const SimpleBlock = () => <div style={styles.box} />;

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
      <div style={styles.partContainer}>
        <div style={styles.separator} />
        <div style={styles.simpleData}>
          <div style={styles.sBs}>
            <SimpleBlock /> Availability: {`${Availability}`}
          </div>
        </div>
        <div style={styles.simpleData}>
          <div style={styles.sBs}>
            <SimpleBlock />
            <div>Description: {`${Description}`}</div>
          </div>
        </div>
        <div style={styles.simpleData}>
          <div style={styles.sBs}>
            <SimpleBlock />
            <div>Manufacturer: {`${Manufacturer}`}</div>
          </div>
        </div>
        <div style={styles.priceBlock}>
          <div style={styles.sBs}>
            <SimpleBlock />
            Price
            <div style={styles.priceSideBySide}>
              <div style={styles.coreCost}>{`Core Price: ${
                Price[0].CoreCost
              }`}</div>
              <div style={styles.coreCost}>{`List Price: ${
                Price[0].ListPrice
              }`}</div>
            </div>
          </div>
        </div>
        <div>
          UserArea
          <div style={styles.uaBlock}>
            <UserAreaComponent data={UserArea} />
          </div>
        </div>
      </div>
    );
  }
}

export const Part = PartComponent;
