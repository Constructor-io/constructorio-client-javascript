version=$(node -pe process.release.lts)
activeLTSCodename="Hydrogen"

if [ $version != $activeLTSCodename ]
then
  echo "Node version is not active LTS - please install active LTS version (\"$activeLTSCodename\") before versioning this library"
  exit 1
else
  exit 0
fi
