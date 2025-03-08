mv doc/out/demos/worker.mjs doc/worker.mjs
node doc/demo/markdown.mjs
bundle exec jekyll build  --config doc/src/_config.yml,doc/src/_config.$1.yml
node doc/demo/bundle.mjs
npx typedoc --options doc/typedoc.json
cp -r doc/assets/* doc/out/assets/
echo "disable jekyll" > doc/out/.nojekyll
mv doc/worker.mjs doc/out/demos/worker.mjs
