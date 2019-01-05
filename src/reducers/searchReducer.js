import { SEARCH_SUBMIT, SEARCH_SUCCESS, SEARCH_FAILED } from "../actions";

export default function(
  state = {
    result: null,
    message: "",
    pending: false,
    error: null,
    parts: []
  },
  action
) {
  switch (action.type) {
    case SEARCH_SUBMIT:
      const submitState = Object.assign({}, state);
      submitState.pending = true;
      return submitState;
    case SEARCH_SUCCESS:
      const successState = Object.assign({}, state);
      successState.result = true;
      successState.pending = false;
      return successState;
    case SEARCH_FAILED:
      const failedState = Object.assign({}, state);
      failedState.result = false;
      failedState.error = "error";
      return failedState;
    default:
      return state;
  }
}
