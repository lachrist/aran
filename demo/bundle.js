
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

const live = (advice, target) => SandboxScenario(
  {type:"raw", path:__dirname+"/live/spawn.js", basedir:"./"},
  [
    {type:"browserify", path:__dirname+"/live/instrument/"+advice+".js"}],
  [
    {type:"raw", path:__dirname+"/target/"+target+".js"}],
  callback("live-"+advice+"-"+target));

const dead = (advice, target) => SandboxScenario(
  {type:"browserify", path:__dirname+"/dead/spawn.js", basedir:"./"},
  [
    {type:"raw", path:__dirname+"/dead/"+advice+"/pointcut.js"},
    {type:"browserify", path:__dirname+"/dead/"+advice+"/advice.js"}],
  [
    {type:"raw", path:__dirname+"/target/"+target+".js"}],
  callback("dead-"+advice+"-"+target));

dead("apply", "factorial");
live("apply-regular-api", "factorial");
live("apply-live-api", "factorial");
live("empty", "empty");
live("eval", "dynamic");
live("forward", "empty");
live("sandbox", "global");
live("shadow-value", "delta");
live("shadow-state", "delta");
