const Path = require("path");
const OtilukeNode = require("otiluke/node");
const Instrument = require(Path.resolve(process.argv[2]));
OtilukeNode((argm, callback) => {
  setTimeout(() => {
    callback(null, Instrument);
  }, 0);
}, {_:process.argv.slice(3)});