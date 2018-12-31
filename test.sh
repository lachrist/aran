testrumenter demo/live :atom > /dev/null
testrumenter demo/live/shadow-value.js :atom > shadow-value.txt
testrumenter demo/live/shadow-state.js :atom > shadow-state.txt
diff shadow-value.txt shadow-state.txt
rm shadow-value.txt shadow-state.txt

# console.log(require("fs").readdirSync("../testrumenter/suite/atom").map((name) => {
#   return "{"+require("fs").readFileSync("../testrumenter/suite/atom/"+name, "utf8")+"}";
# }).join("\n"));
