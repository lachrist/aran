testrumenter live/ target/atom/ > /dev/null
testrumenter live/shadow-value.js target/atom/ > shadow-value.txt
testrumenter live/shadow-state.js target/atom/ > shadow-state.txt
diff shadow-value.txt shadow-state.txt
rm shadow-value.txt shadow-state.txt

# console.log(require("fs").readdirSync("../testrumenter/suite/atom").map((name) => {
#   return "{"+require("fs").readFileSync("../testrumenter/suite/atom/"+name, "utf8")+"}";
# }).join("\n"));

