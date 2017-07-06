var OtilukeTest = require("otiluke/test");
var Fs = require("fs");
var Path = require("path");
var benchmark = Path.join(__dirname, "..", "..", "benchmark", "atom");
var server = OtilukeTest({
  virus: Path.join(__dirname, "1-Empty.js"),
  parametrize: function (origin) {
    return null;
  },
  channel: {
    onrequest: function (method, path, headers, body, callback) {
      //console.log(method+" "+path+" "+JSON.stringify(headers)+" "+body);
      callback(200, "OK", {}, "");
    },
    onconnect: function (con) {
      con.on("message", function (message) {
        //console.log(message);
      });
    }
  },
  mains: Fs.readdirSync(benchmark).map(function (name) {
    return Path.join(benchmark, name);
  }),
  output: process.stdout
});
server.listen();