node doc/demo/markdown.mjs
bundle exec jekyll build  --config doc/src/_config.yml
node doc/demo/bundle.mjs
npx typedoc --options doc/typedoc.json
cp -r doc/assets/* doc/aran/assets/
echo "disable jekyll" > doc/aran/.nojekyll
