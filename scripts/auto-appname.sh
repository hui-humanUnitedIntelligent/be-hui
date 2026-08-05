#!/bin/bash

echo "Lese Version aus package.json..."
VERSION=$(node -p "require('./package.json').version")

APPNAME="HUI v$VERSION"

echo "Setze sichtbaren App-Namen auf: $APPNAME"

sed -i "s/<string name=\"app_name\">.*<\/string>/<string name=\"app_name\">$APPNAME<\/string>/" android/app/src/main/res/values/strings.xml

echo "App-Name erfolgreich gesetzt."
