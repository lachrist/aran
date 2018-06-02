const AranLive = require("aran/live");
const aranlive = AranLive({});
module.exports = (script, source) => aranlive.instrument(script);