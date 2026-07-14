#!/bin/bash

VERSION=$(grep '"version"' package.json | sed -E 's/.*"version": "([0-9]+\.[0-9]+\.[0-9]+)".*/\1/')
IFS='.' read -r major minor patch <<< "$VERSION"
NEW_PATCH=$((patch + 1))
NEW_VERSION="$major.$minor.$NEW_PATCH"

sed -i "s/\"version\": \"$VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json

echo "Neue Version: $NEW_VERSION"
