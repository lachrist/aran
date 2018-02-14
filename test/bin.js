
const Fs = require("fs");
const Util = require("util");
const Path = require("path");
const Minimist = require("minimist");
const Test = require("./index.js");

if (process.argv.length < 4) {
  process.stderr.write("usage: node bin.js advice.js script[.js] [--namespace META] [--output EstreeValid] [--nocache]\n");
  process.exit(1);
}

const options = Minimist(process.argv.slice(4));

if (/\.js$/.test(process.argv[3])) {
  const Advice = require(Path.resolve(process.argv[2]));
  const test = Test(options, Advice, Fs.readFileSync(process.argv[3], "utf8"));
  console.log(test.script);
  console.log(test.success ? "Success" : "Failure");
  console.log(Util.inspect(test.value, {depth:10,colors:true}));
} else {
  if (process.argv[3][process.argv[3].length -1] !== "/")
    process.argv[3] = process.argv[3]+ "/";
  const Advice = require(Path.resolve(process.argv[2]));
  const failures = [];
  Fs.readdirSync(process.argv[3]).forEach((filename) => {
    if (/\.js$/.test(filename)) {
      const test = Test(options, Advice, Fs.readFileSync(process.argv[3]+filename, "utf8"));
      while (filename.length < 25)
        filename += " ";
      console.log(filename, test.success ? "Success" : "Failure");
      test.success || failures.push(filename);
    }
  });
  if (failures.length) {
    console.log("\nFailures:\n  "+failures.join("\n  "));
  } else {
    console.log("\nNo failure :)");
  }
}
