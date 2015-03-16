
var b = require("browserify")()
b.add(__dirname+"/main.js")
b.bundle().pipe(require("fs").createWriteStream(__dirname+"/bundle.js"))
