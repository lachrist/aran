
const Forward = require("./forward.js");
const Insert = require("./insert.js");
const TrapArguments = require("./trap-arguments.js");

const categories = {};
for (let category in TrapArguments) {
  for (let key in TrapArguments[category]) {
    categories[key] = category;
  }
}

const fork = (boolean, key) => (
  boolean ?
  Intercept(key) :
  Forward[categories[key]]);
