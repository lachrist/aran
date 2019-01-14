
const Fs = require("fs");
const SandboxScenario = require("sandbox-scenario");

const callback = (name) => (error, script) => {
  if (error)
    throw error;
  Fs.writeFileSync(__dirname+"/output/"+name+".html", [
    "<!DOCTYPE html>",
    "<html>",
    "  <head>",
    "    <title>"+name+"</title>",
    "  </head>",
    "  <body>",
    "    <script type=\"text/javascript\">",
    script.replace(/<\/script>/g, "<\\/script>"),
    "    </script>",
    "  </body>",
    "</html>"
  ].join("\n"), "utf8");
}

const live = (analysis, target) => SandboxScenario(
  {type:"browserify", path:__dirname+"/spawn-live.js", basedir:"./"},
  [
    {type:"browserify", path:__dirname+"/live/"+analysis+".js"}],
  [
    {type:"raw", path:__dirname+"/target/"+target+".js"}],
  callback("live-"+analysis+"-"+target));

const dead = (analysis, target) => SandboxScenario(
  {type:"browserify", path:__dirname+"/spawn-dead.js", basedir:"./"},
  [
    {type:"browserify", path:__dirname+"/dead/"+analysis+"-pointcut.js"},
    {type:"browserify", path:__dirname+"/dead/"+analysis+"-advice.js"}],
  [
    {type:"raw", path:__dirname+"/target/"+target+".js"}],
  callback("dead-"+analysis+"-"+target));

dead("apply", "factorial");
live("apply", "factorial");
// live("empty", "empty");
// live("eval", "dynamic");
// live("forward", "empty");
// live("sandbox", "global");
// live("shadow-value", "delta");
// live("shadow-state", "delta");
