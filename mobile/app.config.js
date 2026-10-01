// Release builds get their version from the git tag (CI sets APP_VERSION / APP_VERSION_CODE),
// so every APK can be installed over the previous one.
module.exports = ({ config }) => ({
    ...config,
    version: process.env.APP_VERSION || config.version,
    android: {
        ...config.android,
        versionCode: Number(process.env.APP_VERSION_CODE || 1),
    },
});
