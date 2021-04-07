version=$(node -pe process.release.lts)

if [ $version == undefined ]
then
  echo "Node version is not LTS - please install LTS via nvm before versioning this library"
  exit 1
else
  exit 0
fi
