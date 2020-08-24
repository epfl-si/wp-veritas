#!/usr/bin/env bash
# Need debug ? set -e -x

# Test for jq
if ! [[ "$(command -v jq)" ]]; then
  echo -e "\e[31mWARNING:\e[39m jq is not installed";
  echo -e "\e[34mCOMMAND:\e[39m sudo apt install jq";
  exit 1;
fi
# Test for npm
if ! [[ "$(command -v npm)" ]]; then
  echo -e "\e[31mWARNING:\e[39m npm is not installed";
  echo -e "\e[34mCOMMAND:\e[39m sudo apt install npm";
  exit 1;
fi

# Print usage
usage() {
  echo ""
  echo "Without arguments, this script will be run interactively and will change the"
  echo "version patch number."
  echo "Options $0"
  echo "  -h, --help: display this help"
  echo "  -d, --display: display current versions and exit"
  echo "  -a, --auto: disable the interactive mode"
  echo "  -v, --version [patch|minor|major|userinput]: change the semver version"
  echo "  -pv, --package-version: output only the package.json version"
  echo ""
  echo "Example: $0 -d"
  echo "Example: $0 -a -v major"
  echo "Example: $0 -a -v 3.2.1"
  echo ""
}
VERSION=$(jq -r .version app/package.json)
summary() {
  if [ "$1" != "" ]; then
    echo ${1^^}
  fi

  echo "  package.json: $VERSION"
  ORIVERSION=$VERSION

  ANSIBLEVERSION=$(cat ansible/roles/epfl.wp-veritas/vars/main.yml | grep 'wp_veritas_image_version:' | cut -d' ' -f2 | tr -d \')
  echo "  main.yml:     $ANSIBLEVERSION"

  HEADERVERSION=$(cat app/imports/ui/components/header/Header.jsx | grep -o 'Version [[:digit:]]\.[[:digit:]]\.[[:digit:]]' | cut -d' ' -f2)
  echo "  Header.jsx:   $HEADERVERSION"
}

VERSIONCHANGE=
INTERACTIVE=1
SHOW=0
PACKAGEVERSION=0
while [ "$1" != "" ]; do
  case $1 in
    -v | --version )           shift
                               VERSIONCHANGE=${1^^}
                               ;;
    -a | --auto )              INTERACTIVE=0
                               ;;
    -d | --display )           SHOW=1
                               ;;
    -pv | --package-version )  PACKAGEVERSION=1
                               ;;
    -h | --help )              usage
                               exit
                               ;;
    * )                        usage
                               exit 1
  esac
  shift
done

change-versions() {
  change-version-package
  change-version-main
  change-version-header
}

change-version-package() {
  if [ -z $VERSIONCHANGE ]; then
    VERSIONCHANGE='PATCH'
  fi
  echo "Changing version in app/package.json"
  case "$VERSIONCHANGE" in
    PATCH)
      cd app/; npm version --no-git-tag-version --allow-same-version patch; cd ..
      ;;
    MINOR)
      cd app/; npm version --no-git-tag-version --allow-same-version minor; cd ..
      ;;
    MAJOR)
      cd app/; npm version --no-git-tag-version --allow-same-version major; cd ..
      ;;
    *)
      cd app/; npm version --no-git-tag-version --allow-same-version $VERSIONCHANGE; cd ..
      ;;
  esac
  VERSION=$(jq -r .version app/package.json)
  echo "Version in package.json is now $VERSION"
}

change-version-main() {
  echo "Changing version in ansible/roles/epfl.wp-veritas/vars/main.yml"
  # As the variable contains dots, sed interprate them as widlcard...
  # → https://stackoverflow.com/a/39660183/960623
  #sed -i "s/$ORIVERSION/$VERSION/g" ansible/roles/epfl.wp-veritas/vars/main.yml
  sed -i "s@$(echo $ORIVERSION | sed 's/\./\\./g')@$VERSION@g" ansible/roles/epfl.wp-veritas/vars/main.yml
}

change-version-header() {
  echo "Changing version in app/imports/ui/components/header/Header.jsx"
  # As the variable contains dots, sed interprate them as widlcard...
  # → https://stackoverflow.com/a/39660183/960623
  #sed -i "s/$ORIVERSION/$VERSION/g" app/imports/ui/components/header/Header.jsx
  sed -i "s@$(echo $ORIVERSION | sed 's/\./\\./g')@$VERSION@g" app/imports/ui/components/header/Header.jsx
}

################################################################################
if [ $SHOW == "1" ]; then
  summary "Versions summary"
  exit 0
fi
if [ $PACKAGEVERSION == "1" ]; then
  echo -n $VERSION
  exit 0
fi
summary "Initial versions"
if [ $INTERACTIVE == "1" ]; then
  read -r -p "Continue? [Y/n]" response
  response=${response,,} # tolower
  if [[ $response =~ ^(yes|y| ) ]] || [[ -z $response ]]; then
     change-versions
  fi
else
  change-versions
fi
summary "Final versions"