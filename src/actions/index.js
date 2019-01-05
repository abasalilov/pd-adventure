/** SEARCH MSG ACTIONS */
// SEARCH_SUCCESS, SEARCH_FAILED;

/* eslint-disable */
export const SEARCH_SUBMIT = "SEARCH_SUBMIT";
export const SEARCH_SUCCESS = "SEARCH_SUCCESS";
export const SEARCH_FAILED = "SEARCH_FAILED";

export const submitSearch = data => async (dispatch, getState, api) => {
  dispatch({
    type: SEARCH_SUBMIT
  });
  console.log("data", data);
  // const res = await api.post("https://gmasdevgroup.com/SEARCH", {
  //   data
  // });
  const res = {};
  res.status = 200;
  if (res.status !== 201) {
    dispatch({
      type: SEARCH_SUCCESS,
      payload: res
    });
  } else {
    dispatch({
      type: SEARCH_FAILED,
      payload: res
    });
  }
};
