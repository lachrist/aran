mv doc/out docs
git branch -D page
git checkout --orphan page
git reset
git add -f docs
git commit -m "deploy to GitHub pages"
git push -f origin page
git checkout -f main
mv docs doc/out
