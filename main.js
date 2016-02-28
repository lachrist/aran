
var Fs = require("fs");
var Instrument = require("./instrument.js");
var Otiluke = require("otiluke");

// options: {
//   namespace: String,
//   traps: [String],
//   loc: Boolean,
//   range: Boolean,
//   filter: Function,
//   analysis: Path,
//   port: Number,
//   main: Path,
// }
module.exports = function (options) {
  var instrument = Instrument({
    namespace: options.namespace,
    traps: options.traps,
    range: options.range,
    loc: options.loc
  });
  return !options.analysis ? instrument : Otiluke({
    setup: options.analysis,
    port: options.port,
    main: options.main,
    out: options.out,
    intercept: function (url) {
      return options.filter && !options.filter(url)
        ? null
        : function (code) { return instrument(code, url) };
    }
  });
}
