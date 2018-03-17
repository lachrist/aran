echo "Testing every analysis..." 
node test/bin.js test/advice/empty.js   test/atom                        > /dev/null
node test/bin.js test/advice/forward.js test/atom                        > /dev/null
node test/bin.js test/advice/log.js     test/atom                        > /dev/null
node test/bin.js test/advice/shadow.js  test/atom                        > /dev/null
echo "Testing every analysis with sandbox..."
node test/bin.js test/advice/empty.js   test/atom --sandbox              > /dev/null
node test/bin.js test/advice/forward.js test/atom --sandbox              > /dev/null
node test/bin.js test/advice/log.js     test/atom --sandbox              > /dev/null
node test/bin.js test/advice/shadow.js  test/atom --sandbox              > /dev/null
echo "Testing the empty analysis with every builders..."
node test/bin.js test/advice/empty.js test/atom --output EstreeValid     > /dev/null
node test/bin.js test/advice/empty.js test/atom --output Estree          > /dev/null
node test/bin.js test/advice/empty.js test/atom --output EstreeOptimized > /dev/null
node test/bin.js test/advice/empty.js test/atom --output String          > /dev/null
echo "Testing every demonstrator..."
node demo/local/chain.js demo/local/run.js demo/local/analysis/apply.js        test/atom > /dev/null
node demo/local/chain.js demo/local/run.js demo/local/analysis/empty.js        test/atom > /dev/null
node demo/local/chain.js demo/local/run.js demo/local/analysis/eval.js         test/atom > /dev/null
node demo/local/chain.js demo/local/run.js demo/local/analysis/sandbox.js      test/atom > /dev/null
node demo/local/chain.js demo/local/run.js demo/local/analysis/forward.js      test/atom > /dev/null
node demo/local/chain.js demo/local/run.js demo/local/analysis/shadow-state.js test/atom > /dev/null
node demo/local/chain.js demo/local/run.js demo/local/analysis/shadow-value.js test/atom > /dev/null
echo "Testing shadow demonstrators (output match)..."
node demo/local/chain.js demo/local/match.js demo/local/analysis/shadow-state.js demo/local/analysis/shadow-value.js test/atom > /dev/null