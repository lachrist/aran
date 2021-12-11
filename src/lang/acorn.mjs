import {Parser as AcornParser} from "acorn";

const options = {
  __proto__: null,
  ecmaVersion: 2022,
  sourceType: "module",
  locations: true,
  allowReturnOutsideFunction: true,
};

/* eslint-disable no-restricted-syntax */
class LooseParser extends AcornParser {
  raiseRecoverable(_position, _message) {}
  raise(position, message) {
    if (message !== "Unsyntactic break") {
      super.raise(position, message);
    }
  }
}
export const parseAcornLoose = (code) => new LooseParser(options, code).parse();
/* eslint-enable no-restricted-syntax */
