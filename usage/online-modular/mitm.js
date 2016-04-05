// otiluke --mitm --transform ./analysis.js --port 8080
require("otiluke").mitm({transform:"./analysis.js", port:8080});