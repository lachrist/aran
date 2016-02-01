
var Fs = require("fs");
var Browserify = require("browserify");
var Instrument = require("./instrument.js");
var Otiluke = require("otiluke");

// options: {
//   namespace: String,
//   traps: [String],
//   loc: Boolean,
//   range: Boolean,
//   filter: Function,
//   port: Number,
//   main: Path,
// }
module.exports = function (options) {
  options.namespace = options.namespace || "aran";
  var instrument = Instrument(options);
  if (!options.port && !options.main)
    return instrument;
  Otiluke({
    intercept: function (url) {
      return (options.filter && !options.filter(url)) ? null : instrument.bind(null, url);
    },
    port: options.port,
    main: options.main
  });
}
