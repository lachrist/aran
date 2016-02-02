
var Fs = require("fs");
var Instrument = require("./instrument.js");
var Otiluke = require("otiluke");

// options: {
//   namespace: String,
//   traps: [String],
//   loc: Boolean,
//   range: Boolean,
//   filter: Function,
//   analysis: String
//   port: Number,
//   main: Path,
// }
module.exports = function (options) {
  options.namespace = options.namespace || "aran";
  var instrument = Instrument(options);
  if (!options.port && !options.main)
    return instrument;
  Otiluke({
    setup: options.analysis,
    port: options.port,
    main: options.main,
    intercept: function (url) {
      return options.filter && !options.filter(url)
        ? null
        : function (code) { return instrument(code, url) };
    }
  });
}
