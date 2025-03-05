mkdir -p page
mkdir -p page/demo
echo "disable jekyll" > page/.nojekyll

npx typedoc
node demo/bundle.mjs

git branch -D page
git checkout --orphan page
git reset
git add -f page
git commit -m "deploy to GitHub pages"
git push -f origin page
git checkout -f main
