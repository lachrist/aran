
const Fs = require("fs");
const SandboxScenario = require("sandbox-scenario");

const callback = (name) => (error, script) => {
  if (error)
    throw error;
  Fs.writeFileSync("output/"+name+".html", [
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

const online = (analysis, target) => SandboxScenario(
  {type:"raw", path:"online/spawn.js", basedir:"./"},
  [
    {type:"browserify", path:"online/analysis/"+analysis+".js"}],
  [
    {type:"raw", path:"target/"+target+".js"}],
  callback("online-"+analysis+"-"+target));

const offline = (analysis, target) => SandboxScenario(
  {type:"browserify", path:"offline/spawn.js", basedir:"./"},
  [
    {type:"raw", path:"offline/"+analysis+"/pointcut.js"},
    {type:"raw", path:"offline/"+analysis+"/advice.js"}],
  [
    {type:"raw", path:"target/"+target+".js"}],
  callback("offline-"+analysis+"-"+target));

offline("apply", "factorial");
online("apply", "factorial");
online("eval", "dynamic-double");
online("forward", "empty");
online("shadow-value", "delta");