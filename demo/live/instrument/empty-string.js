const AranLive = require("aran/live");
const aranlive = AranLive({}, {output:"String"});
module.exports = (script, source) => aranlive.instrument(script);