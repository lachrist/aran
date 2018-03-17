// Usage node bin.js path/to/advice.js path/to/target[.js] [--namespace META] [--output EstreeValid] [--nocache] [--nosandbox]
const Fs = require("fs");
const Util = require("util");
const Path = require("path");
const Minimist = require("minimist");
const Weave = require("./weave.js");
const geval = global.eval
const options = Minimist(process.argv.slice(4));
const weave = Weave(options, require(Path.resolve(process.argv[2])));
if (/\.js$/.test(process.argv[3])) {
  const script = weave(Fs.readFileSync(process.argv[3], "utf8"));
  process.stdout.write(script+"\n");
  process.stdout.write(Util.inspect(geval(script), {depth:10, colors:true})+"\n");
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
        process.stdout.write(filename+"Success\n");
      } catch (error) {
        filenames.push(filename);
        process.stderr.write(filename+"Failure\n");
      }
    }
  });
  if (filenames.length) {
    process.stderr.write("\nFailures:\n  "+filenames.join("\n  ")+"\n");
  } else {
    process.stdout.write("\nNo failure :)\n");
  }
}