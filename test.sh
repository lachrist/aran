testrumenter demo/live/instrument :atom > /dev/null
testrumenter demo/live/instrument/shadow-value.js :atom > shadow-value.txt
testrumenter demo/live/instrument/shadow-state.js :atom > shadow-state.txt
diff shadow-value.txt shadow-state.txt
rm shadow-value.txt shadow-state.txt