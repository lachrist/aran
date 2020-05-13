const Fs = require("fs");
const Path = require("path");
const Analysis = require(Path.resolve(process.argv[2]));
Analysis(Fs.readFileSync(process.argv[3], "utf8"));