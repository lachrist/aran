mkdir -p page
echo "disable jekyll" > page/.nojekyll

npx typedoc

npx rollup -c demo/rollup.config.mjs
cp demo/index.html page/demo

git branch -D page
git checkout --orphan page
git reset
git add -f page
git commit -m "deploy to GitHub pages"
git push -f origin page
git checkout -f main
