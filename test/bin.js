const Fs = require("fs");
const Util = require("util");
const Path = require("path");
const Minimist = require("minimist");
const Weave = require("./weave.js");
const geval = global.eval
if (process.argv.length < 4) {
  process.stderr.write("usage: node bin.js advice.js script[.js] [--namespace META] [--output EstreeValid] [--nocache] [--nosetup]\n");
  process.exit(1);
}
const options = Minimist(process.argv.slice(4));
const weave = Weave(options, require(Path.resolve(process.argv[2])));
if (/\.js$/.test(process.argv[3])) {
  const script = weave(Fs.readFileSync(process.argv[3], "utf8"));
  console.log(script);
  console.log(Util.inspect(geval(script), {depth:10, colors:true}));
} else {
  process.argv[3] = Path.resolve(process.argv[3]);
  const filenames = [];
  Fs.readdirSync(process.argv[3]).forEach((filename) => {
    if (/\.js$/.test(filename)) {
      const script = weave(Fs.readFileSync(process.argv[3]+"/"+filename, "utf8"));
      while (filename.length < 25)
        filename += " ";
      try {
        geval(script);
        console.log(filename, "Success");
      } catch (error) {
        filenames.push(filename);
        console.log(filename, "Failure");
      }
    }
  });
  if (filenames.length) {
    console.log("\nFailures:\n  "+filenames.join("\n  "));
  } else {
    console.log("\nNo failure :)");
  }
}