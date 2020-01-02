pkg teleport.js -t node10-linux-x64 --out-path ../teleport-server/lib/assets/
version=`cat package.json | jq '.version'`
ver=${version#'"'}
ver=${ver%'"'}
mv ../teleport-server/lib/assets/teleport ../teleport-server/lib/assets/teleport-"${ver}"