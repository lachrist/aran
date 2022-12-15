import { assert } from "./assert.mjs";

export const makeLeft = (payload) => ({
  type: "left",
  payload,
});

export const makeRight = (payload) => ({
  type: "right",
  payload,
});

export const isLeft = ({ type }) => type === "left";

export const isRight = ({ type }) => type === "right";

export const fromLeft = ({ type, payload }) => {
  assert(type === "left", "expected left either");
  return payload;
};

export const fromRight = ({ type, payload }) => {
  assert(type === "right", "expected right either");
  return payload;
};
