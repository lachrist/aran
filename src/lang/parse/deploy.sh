pegjs --trace --allowed-start-rules _,LabelIdentifier,VariableIdentifier,String,Number,BigInt,StartProgram,StartLink,StartBlock,StartBranch,StartSingleStatement,StartStatement,StartExpression parser.pegjs &&
node parser.test.js &&
nyc --reporter=html --include parser.js node parser.test.js &&
pegjs --allowed-start-rules StartProgram,StartLink,StartBranch,StartBlock,StartStatement,StartSingleStatement,StartExpression parser.pegjs &&
echo "done"
