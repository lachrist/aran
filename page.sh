mkdir -p page
mkdir -p page/demo
echo "disable jekyll" > page/.nojekyll

npx typedoc

node demo/bundle.mjs
cp demo/case/apply.html page/demo/apply.html
cp demo/case/trace.html page/demo/trace.html
cp demo/case/provenance.html page/demo/provenance.html

git branch -D page
git checkout --orphan page
git reset
git add -f page
git commit -m "deploy to GitHub pages"
git push -f origin page
git checkout -f main
