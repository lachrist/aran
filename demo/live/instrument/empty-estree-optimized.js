const AranLive = require("aran/live");
const aranlive = AranLive({}, {output:"EstreeOptimized"});
module.exports = (script, source) => aranlive.instrument(script);