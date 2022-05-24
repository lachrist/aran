const {
  Math: {random, round},
  Number: {
    prototype: {toString: toNumberString},
  },
  Date: {now},
  Reflect: {apply},
} = globalThis;

const ENCODING = [36];

let uuid = null;

export const getUUID = () => {
  uuid = `${apply(toNumberString, now(), ENCODING)}_${apply(
    toNumberString,
    round(10e12 * random()),
    ENCODING,
  )}`;
  return uuid;
};

export const getLatestUUID = () => uuid;
