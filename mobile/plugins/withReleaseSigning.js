// Signs release builds with the keystore given by environment variables (set in GitHub Actions).
// Without ANDROID_KEYSTORE_PATH the release build falls back to the debug key, so local builds still work.
const { withAppBuildGradle } = require('expo/config-plugins');

const RELEASE_SIGNING = `
        release {
            if (System.getenv('ANDROID_KEYSTORE_PATH')) {
                storeFile file(System.getenv('ANDROID_KEYSTORE_PATH'))
                storePassword System.getenv('ANDROID_KEYSTORE_PASSWORD')
                keyAlias System.getenv('ANDROID_KEY_ALIAS')
                keyPassword System.getenv('ANDROID_KEY_PASSWORD')
            }
        }`;

const RELEASE_SIGNING_REF = "signingConfig System.getenv('ANDROID_KEYSTORE_PATH') ? signingConfigs.release : signingConfigs.debug";

module.exports = function withReleaseSigning(config) {
    return withAppBuildGradle(config, (cfg) => {
        let gradle = cfg.modResults.contents;
        if (gradle.includes("System.getenv('ANDROID_KEYSTORE_PATH')")) return cfg;

        // 1. Add a `release` signing config next to the template's `debug` one.
        if (!/signingConfigs\s*\{/.test(gradle)) throw new Error('withReleaseSigning: signingConfigs block not found');
        gradle = gradle.replace(/signingConfigs\s*\{/, (m) => m + RELEASE_SIGNING);

        // 2. Point the release build type at it.
        const buildTypes = gradle.search(/buildTypes\s*\{/);
        const release = gradle.slice(buildTypes).search(/release\s*\{/);
        if (buildTypes < 0 || release < 0) throw new Error('withReleaseSigning: buildTypes.release block not found');
        const start = buildTypes + release;
        const rest = gradle.slice(start).replace('signingConfig signingConfigs.debug', RELEASE_SIGNING_REF);
        if (rest === gradle.slice(start)) throw new Error('withReleaseSigning: release signingConfig line not found');
        cfg.modResults.contents = gradle.slice(0, start) + rest;
        return cfg;
    });
};
