import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { Provider } from "react-redux";
import { createStore, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import reducers from "./reducers";
import { MuiThemeProvider, createMuiTheme } from "@material-ui/core/styles";

const theme = createMuiTheme({
  palette: {
    type: "light"
  },
  typography: {
    useNextVariants: true,
    subheading: {
      fontSize: "2rem"
    },
    button: {
      fontSize: "2rem"
    },
    body1: {
      fontSize: "2rem"
    },
    body2: {
      fontSize: "2rem"
    }
  },
  li: {
    border: "solid blue 1px"
  },
  listItemText: {
    fontSize: "3em" //Insert your required size
  }
});

const store = createStore(reducers, applyMiddleware(thunk));

ReactDOM.render(
  <MuiThemeProvider theme={theme}>
    <Provider store={store}>
      <App />
    </Provider>
  </MuiThemeProvider>,
  document.getElementById("root")
);
