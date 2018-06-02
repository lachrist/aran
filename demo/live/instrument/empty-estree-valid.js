const AranLive = require("aran/live");
const aranlive = AranLive({}, {output:"EstreeValid"});
module.exports = (script, source) => aranlive.instrument(script);