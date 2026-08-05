#!/bin/bash

echo "Lese aktuelle Version aus package.json..."
VERSION=$(node -p "require('./package.json').version")

IFS='.' read -r major minor patch <<< "$VERSION"
patch=$((patch + 1))
NEW_VERSION="$major.$minor.$patch"

echo "Erhöhe Version in package.json auf $NEW_VERSION..."
npm version $NEW_VERSION --no-git-tag-version

echo "Setze versionName in build.gradle..."
sed -i "s/versionName \".*\"/versionName \"$NEW_VERSION\"/" android/app/build.gradle

echo "Erhöhe versionCode..."
VERSION_CODE=$(grep versionCode android/app/build.gradle | awk '{print $2}')
VERSION_CODE=$((VERSION_CODE + 1))
sed -i "s/versionCode .*/versionCode $VERSION_CODE/" android/app/build.gradle

echo "Neue Version: $NEW_VERSION"
echo "Neuer VersionCode: $VERSION_CODE"
