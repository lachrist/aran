// http-server ../target/html -p 8000
// otiluke --mitm --transpile ./analysis.js --port 8080
require("otiluke").mitm({transpile:"./analysis.js", port:8080});