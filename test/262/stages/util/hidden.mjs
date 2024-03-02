/* eslint-disable local/strict-console */
const { console, setTimeout } = globalThis;
/* eslint-enable local/strict-console */

export const HIDDEN = {
  _ARAN_LOG_: {
    __proto__: null,
    value: (/** @type {unknown} */ value) => {
      console.dir(value, { showHidden: true });
    },
    writable: false,
    enumerable: false,
    configurable: false,
  },
  _ARAN_SET_TIMEOUT_: {
    __proto__: null,
    value: setTimeout,
    writable: false,
    enumerable: false,
    configurable: false,
  },
};
