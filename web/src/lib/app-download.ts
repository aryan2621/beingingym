const REPO = 'aryan2621/beingingym';

/** File name the GitHub release must attach the Android build as. */
export const APK_ASSET_NAME = 'BeingInGym.apk';

/** GitHub's "latest release" asset URL never changes, so the QR code keeps working across releases. */
export const APK_URL = process.env.NEXT_PUBLIC_APK_URL || `https://github.com/${REPO}/releases/latest/download/${APK_ASSET_NAME}`;

export const RELEASES_URL = `https://github.com/${REPO}/releases`;
