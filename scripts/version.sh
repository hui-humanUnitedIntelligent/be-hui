#!/bin/bash
VERSION=$(jq -r '.version' package.json)
NEW_VERSION=$(echo $VERSION | awk -F. -v OFS=. '{$NF++; print}')
jq ".version=\"$NEW_VERSION\"" package.json > package.tmp.json
mv package.tmp.json package.json
echo "Neue Version: $NEW_VERSION"
