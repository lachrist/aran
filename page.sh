mkdir -p page
echo "disable jekyll" > page/.nojekyll

npx typedoc

node demo/bundle.mjs
cp demo/case/apply.html page/demo
cp demo/case/trace.html page/demo
cp demo/case/provenance.html page/demo

git branch -D page
git checkout --orphan page
git reset
git add -f page
git commit -m "deploy to GitHub pages"
git push -f origin page
git checkout -f main
