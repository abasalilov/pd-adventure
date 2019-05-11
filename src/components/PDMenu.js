import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import MenuItem from "@material-ui/core/MenuItem";
import Menu from "@material-ui/core/Menu";

const styles = theme => ({
  root: {
    width: "100%",
    maxWidth: "900px",
    backgroundColor: theme.palette.background.paper,
    fontSize: "3rem"
  },
  li: {
    border: "solid blue 1px"
  },

  listItemText: {
    fontSize: "7em" //Insert your required size
  },
  typography: {
    subheading: {
      fontSize: "3rem"
    },
    button: {
      fontSize: "2rem"
    },
    body1: {
      fontSize: "2rem"
    }
  }
});

const options = ["Parts Detect Test Menu", "AutoZone", "Napa"];

class SimpleListMenu extends React.Component {
  state = {
    anchorEl: null,
    selectedIndex: null
  };

  handleClickListItem = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleMenuItemClick = (event, index, option) => {
    this.setState({ selectedIndex: index, anchorEl: null });
    this.props.select(option.toUpperCase());
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  render() {
    const { classes } = this.props;
    const { anchorEl } = this.state;

    return (
      <div fontSize={16}>
        <List component="nav" className={classes.root}>
          <ListItem
            button
            aria-haspopup="true"
            aria-controls="lock-menu"
            aria-label="Parts Detect Test Menu"
            onClick={this.handleClickListItem}
          >
            <ListItemText
              primary="Parts Detect Test Menu"
              secondary={options[this.state.selectedIndex]}
            />
          </ListItem>
        </List>
        <Menu
          id="lock-menu"
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={this.handleClose}
        >
          {options.map((option, index) => (
            <MenuItem
              key={option}
              disabled={index === 0}
              selected={index === this.state.selectedIndex}
              onClick={event => this.handleMenuItemClick(event, index, option)}
            >
              {option}
            </MenuItem>
          ))}
        </Menu>
      </div>
    );
  }
}

SimpleListMenu.propTypes = {
  classes: PropTypes.object.isRequired
};

export const PDMenu = withStyles(styles)(SimpleListMenu);
