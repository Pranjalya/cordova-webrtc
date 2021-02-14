git checkout --orphan gh-pages
npm install
npm run cordova-build-browser
git --work-tree dist add --all
git --work-tree dist commit -m 'deployed :wrench:'
git push origin HEAD:gh-pages --force
rm -r dist
git checkout -f master
git branch -D gh-pages