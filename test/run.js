var Aran = require("../main.js");
//var instrument = Aran.static({range:true, loc:true, namespace:"aran", traps:["apply"]});
//console.log(instrument("console.log('swag')").instrumented);
Aran.mitm({analysis:__dirname+"/analysis.js", namespace:"aran", port:8080});