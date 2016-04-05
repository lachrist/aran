// http-server ../target/html -p 8000
// otiluke --mitm --transform ./analysis.js --port 8080
require("otiluke").mitm({transform:__dirname+"/analysis.js", port:8080});