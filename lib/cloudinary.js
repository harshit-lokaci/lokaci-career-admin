import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Generate a fresh, time-limited cryptographic signed URL for private/authenticated resumes.
 * @param {string} storedUrlOrPublicId
 * @param {number} expiresInSeconds Default 7200 (2 hours)
 * @returns {string} Signed accessible URL or original external URL
 */
export function signCloudinaryResume(storedUrlOrPublicId, expiresInSeconds = 7200) {
	if (!storedUrlOrPublicId || typeof storedUrlOrPublicId !== "string") {
		return "";
	}

	// External links (Google Drive, Dropbox, OneDrive, etc.) remain as-is
	if (
		!storedUrlOrPublicId.includes("cloudinary.com") &&
		!storedUrlOrPublicId.startsWith("lokaci_resumes/")
	) {
		return storedUrlOrPublicId;
	}

	// Backwards compatibility: Existing resumes uploaded earlier in public mode remain accessible
	if (storedUrlOrPublicId.includes("/raw/upload/")) {
		return storedUrlOrPublicId;
	}

	// Extract publicId (e.g., lokaci_resumes/1792384678776_MyResume.pdf)
	const match = storedUrlOrPublicId.match(/lokaci_resumes\/[^?#]+/);
	if (!match) {
		return storedUrlOrPublicId;
	}
	const publicId = match[0];

	try {
		return cloudinary.utils.url(publicId, {
			resource_type: "raw",
			type: "authenticated",
			sign_url: true,
			secure: true,
			expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
		});
	} catch (err) {
		console.error("Failed to sign Cloudinary URL:", err);
		return storedUrlOrPublicId;
	}
}

export { cloudinary };
export default cloudinary;
