
# cp doc/out/demo/worker.mjs doc/worker.mjs
node doc/demo/markdown.mjs
bundle exec jekyll build  --config doc/src/_config.yml
node doc/demo/bundle.mjs
npx typedoc --options doc/typedoc.json
cp -r doc/assets/* doc/out/assets/
echo "disable jekyll" > doc/out/.nojekyll
# cp doc/worker.mjs doc/out/demo/worker.mjs
