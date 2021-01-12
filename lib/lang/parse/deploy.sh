pegjs --trace --allowed-start-rules _,Label,Identifier,String,Number,BigInt,StartProgram,StartLink,StartBlock,StartLabelBlock,StartStatement,StartExpression parser.pegjs &&
node parser.test.js &&
nyc --reporter=html --include parser.js node parser.test.js &&
pegjs --allowed-start-rules StartProgram,StartLink,StartLabelBlock,StartBlock,StartStatement,StartExpression parser.pegjs &&
echo "done"
