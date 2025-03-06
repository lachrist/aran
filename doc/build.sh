
node doc/demo/bundle.mjs
bundle exec jekyll build  --config doc/src/_config.yml
npx typedoc --options doc/typedoc.json
echo "disable jekyll" > doc/out/.nojekyll
