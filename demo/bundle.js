
const Fs = require("fs");
const SandboxScenario = require("sandbox-scenario");

const callback = (name) => (error, script) => {
  if (error)
    throw error;
  Fs.writeFileSync(__dirname+"/output/"+name+".html", [
    "<!DOCTYPE html>",
    "<html>",
    "  <head>",
    "    <title>sandbox-scenario demo</title>",
    "  </head>",
    "  <body>",
    "    <script type=\"text/javascript\">",
    script.replace(/<\/script>/g, "<\\/script>"),
    "    </script>",
    "  </body>",
    "</html>"
  ].join("\n"), "utf8");
}

const local = (analysis, target) => SandboxScenario(
  {type:"raw", path:__dirname+"/local/spawn.js", basedir:"./"},
  [
    {type:"browserify", path:__dirname+"/local/analysis/"+analysis+".js"}],
  [
    {type:"raw", path:__dirname+"/target/"+target+".js"}],
  callback("local-"+analysis+"-"+target));

const remote = (analysis, target) => SandboxScenario(
  {type:"browserify", path:__dirname+"/remote/spawn.js", basedir:"./"},
  [
    {type:"raw", path:__dirname+"/remote/"+analysis+"/pointcut.js"},
    {type:"raw", path:__dirname+"/remote/"+analysis+"/advice.js"}],
  [
    {type:"raw", path:__dirname+"/target/"+target+".js"}],
  callback("remote-"+analysis+"-"+target));

// remote("apply", "factorial");
// local("apply", "factorial");
// local("empty", "empty");
// local("eval", "dynamic");
// local("forward", "empty");
// local("sandbox", "global");
// local("shadow-value", "delta");
// local("shadow-state", "delta");
local("apply-operate", "delta2");