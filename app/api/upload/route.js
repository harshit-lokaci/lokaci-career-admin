import { NextResponse } from "next/server";
import { cloudinary, signCloudinaryResume } from "@/lib/cloudinary";
import { corsHeaders } from "@/lib/cors";

export async function OPTIONS() {
	return new Response(null, {
		status: 200,
		headers: corsHeaders(),
	});
}

// POST /api/upload -> Upload resume PDF/DOCX to Cloudinary in authenticated (private) mode
export async function POST(request) {
	try {
		const formData = await request.formData();
		const file = formData.get("file");

		if (!file || typeof file === "string") {
			return NextResponse.json(
				{ success: false, error: "No file provided for upload." },
				{ status: 400, headers: corsHeaders() }
			);
		}

		// 1. Validate file extension
		const originalName = file.name || "resume.pdf";
		const extension = originalName.split(".").pop().toLowerCase();
		const allowedExtensions = ["pdf", "doc", "docx"];

		if (!allowedExtensions.includes(extension)) {
			return NextResponse.json(
				{
					success: false,
					error: "Invalid file format. Only PDF, DOC, and DOCX files are allowed.",
				},
				{ status: 400, headers: corsHeaders() }
			);
		}

		// 2. Validate file size (max 10MB)
		const maxSizeBytes = 10 * 1024 * 1024;
		if (file.size > maxSizeBytes) {
			return NextResponse.json(
				{
					success: false,
					error: "File size exceeds 10MB limit. Please upload a smaller document.",
				},
				{ status: 400, headers: corsHeaders() }
			);
		}

		// 3. Convert Web File to Buffer for Cloudinary SDK stream upload
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		const cleanBaseName = originalName
			.replace(/\.[^/.]+$/, "")
			.replace(/[^a-zA-Z0-9_-]/g, "_");
		const publicId = `${Date.now()}_${cleanBaseName}.${extension}`;

		// 4. Upload using official Cloudinary SDK in authenticated (private) mode
		const cloudinaryResult = await new Promise((resolve, reject) => {
			const stream = cloudinary.uploader.upload_stream(
				{
					resource_type: "raw", // Keeps raw PDF/DOC headers intact without transcoding
					type: "authenticated", // 🔒 Private delivery with signature
					folder: "lokaci_resumes",
					public_id: publicId,
				},
				(error, result) => {
					if (error) reject(error);
					else resolve(result);
				}
			);
			stream.end(buffer);
		});

		if (!cloudinaryResult || !cloudinaryResult.public_id) {
			return NextResponse.json(
				{
					success: false,
					error: "Failed to store resume on cloud storage. Please try again.",
				},
				{ status: 500, headers: corsHeaders() }
			);
		}

		// Generate signed URL for immediate preview (valid for 2 hours)
		const signedPreviewUrl = signCloudinaryResume(cloudinaryResult.public_id, 7200);

		return NextResponse.json(
			{
				success: true,
				url: signedPreviewUrl,
				publicId: cloudinaryResult.public_id,
				bytes: cloudinaryResult.bytes,
				format: extension,
				originalFilename: originalName,
			},
			{ status: 200, headers: corsHeaders() }
		);
	} catch (error) {
		console.error("POST /api/upload error:", error);
		return NextResponse.json(
			{ success: false, error: error.message || "Internal server error during upload." },
			{ status: 500, headers: corsHeaders() }
		);
	}
}
