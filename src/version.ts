import pkg from "../package.json";

export const APP_VERSION = pkg.version;

// Optional: versionCode aus der Version ableiten
export const APP_VERSION_CODE = Number(pkg.version.replace(/\./g, ""));

export default APP_VERSION;
