/** SEARCH MSG ACTIONS */
// SEARCH_SUCCESS, SEARCH_FAILED;
import axios from "axios";
/* eslint-disable */
export const SEARCH_SUBMIT = "SEARCH_SUBMIT";
export const SEARCH_SUCCESS = "SEARCH_SUCCESS";
export const SEARCH_FAILED = "SEARCH_FAILED";

const headers = {
  "x-requested-with": "XMLHttpRequest",
  "x-access-token":
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI1YzFlZWFiZTM1ZGNlOTM4ZDM1NTc1ODEiLCJleHAiOjE1NzcwNjYwNDYyMTZ9.oBKZp6Snq0M09ahr7ES4BuddTgeaR3sUJ5FxygfubaM"
};

const localReq = axios.create({
  headers
});

export const submitSearch = data => async (dispatch, getState, api) => {
  dispatch({
    type: SEARCH_SUBMIT
  });
  const { searchTerm, vin } = data;
  const res = await localReq.post("http://localhost:3001/search/autozone", {
    searchTerm,
    vin,
    azCategory: "",
    user: {
      api: {
        expires: "2019-12-23T01:54:06.216Z",
        token:
          "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI1YzFlZWFiZTM1ZGNlOTM4ZDM1NTc1ODEiLCJleHAiOjE1NzcwNjYwNDYyMTZ9.oBKZp6Snq0M09ahr7ES4BuddTgeaR3sUJ5FxygfubaM"
      },
      providers: ["autozone"],
      autozone: { phone: "6023312706", pin: "764505" },
      partsAuthority: {},
      advanceAuto: {},
      __v: 0,
      password: "$2b$10$IVbzwQO/Ma3iODdunVe/P.d275Wf0NKSQz887/YA3n.b4SSTDnO6K",
      email: "alek@aleks.co",
      name: "Aleks",
      mode: "LIVE",
      _id: "5c1eeabe35dce938d3557581"
    }
  });

  console.log("res.status", res.data);
  if (res.status !== 201) {
    dispatch({
      type: SEARCH_SUCCESS,
      payload: res.data.autozone.parts
    });
  } else {
    dispatch({
      type: SEARCH_FAILED,
      payload: res
    });
  }
};

export const submitNapaSearch = data => async (dispatch, getState, api) => {
  dispatch({
    type: SEARCH_SUBMIT
  });
  const { searchTerm, vin } = data;
  const res = await localReq.post("http://localhost:3001/search/napa", {
    searchTerm,
    vin,
    azCategory: "",
    user: {
      api: {
        expires: "2019-12-23T01:54:06.216Z",
        token:
          "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI1YzFlZWFiZTM1ZGNlOTM4ZDM1NTc1ODEiLCJleHAiOjE1NzcwNjYwNDYyMTZ9.oBKZp6Snq0M09ahr7ES4BuddTgeaR3sUJ5FxygfubaM"
      },
      providers: ["autozone"],
      autozone: { phone: "6023312706", pin: "764505" },
      partsAuthority: {},
      advanceAuto: {},
      __v: 0,
      password: "$2b$10$IVbzwQO/Ma3iODdunVe/P.d275Wf0NKSQz887/YA3n.b4SSTDnO6K",
      email: "alek@aleks.co",
      name: "Aleks",
      mode: "LIVE",
      _id: "5c1eeabe35dce938d3557581"
    }
  });

  console.log("res.status", res.data);
  if (res.status !== 201) {
    dispatch({
      type: SEARCH_SUCCESS,
      payload: res.data.autozone.parts
    });
  } else {
    dispatch({
      type: SEARCH_FAILED,
      payload: res
    });
  }
};
