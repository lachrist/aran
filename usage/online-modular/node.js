// http-server ./target/html -p 8000

// otiluke --node --transform ./analysis.js --main ../target/commonjs/main.js
require("otiluke").node({transform:__dirname+"/analysis.js", main:__dirname+"/../target/node/main.js"});