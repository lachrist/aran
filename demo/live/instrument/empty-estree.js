const AranLive = require("aran/live");
const aranlive = AranLive({}, {output:"Estree"});
module.exports = (script, source) => aranlive.instrument(script);