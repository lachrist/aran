const Fs = require("fs");
const Path = require("path");
const SandboxScenario = require("sandbox-scenario");
const spawn = {
  type: "raw",
  path: Path.join(__dirname, "spawn.js")
};
const notdstore = (name) => name !== ".DS_Store"; 
const children = Fs.readdirSync(Path.join(__dirname, "target")).filter(notdstore).map((name) => ({
  type: "raw",
  path: Path.join(__dirname, "target", name),
}));
Fs.readdirSync(Path.join(__dirname, "page")).filter(notdstore).forEach((name) => {
  Fs.unlinkSync(Path.join(__dirname, "page", name));
});
Fs.readdirSync(Path.join(__dirname, "analysis")).filter(notdstore).forEach((name) => {
  SandboxScenario(spawn, [{
    type: "browserify",
    path: Path.join(__dirname, "analysis", name)
  }], children, (error, bundle) => {
    if (error)
      throw error;
    Fs.writeFileSync(Path.join(__dirname, "page", Path.basename(name, ".js")+".html"), [
      "<!DOCTYPE html>",
      "<html>",
      "  <head>",
      "    <title>aran "+Path.basename(name, ".js")+" demo</title>",
      "  </head>",
      "  <body>",
      "    <script type=\"text/javascript\">",
      bundle.replace("</script>", "<\\/script>"),
      "    </script>",
      "  </body>",
      "</html>"
    ].join("\n"));
  });
});