var Trace = require("./3-Trace.js");
window.log = function (msg) {
  var req = new XMLHttpRequest();
  req.open("POST", "https://localhost:8000", true);
  req.send(msg);
};
window.__hidden__ = {};
window.__hidden__.script = function (js) { eval(Trace(js)) };
