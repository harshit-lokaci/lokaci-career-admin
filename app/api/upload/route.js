import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { corsHeaders } from "@/lib/cors";

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dgazn8zi3",
	api_key: process.env.CLOUDINARY_API_KEY || "565587288496578",
	api_secret: process.env.CLOUDINARY_API_SECRET || "Q1iPr8gkAqo_wchKxnJGjlKhkyc",
});

export async function OPTIONS() {
	return new Response(null, {
		status: 200,
		headers: corsHeaders(),
	});
}

// POST /api/upload -> Upload resume PDF/DOCX to Cloudinary via official SDK
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
		const publicId = `${Date.now()}_${cleanBaseName}`;

		// 4. Upload using official Cloudinary SDK upload_stream
		const cloudinaryResult = await new Promise((resolve, reject) => {
			const stream = cloudinary.uploader.upload_stream(
				{
					resource_type: "raw", // Keeps raw PDF/DOC headers intact without transcoding
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

		if (!cloudinaryResult || !cloudinaryResult.secure_url) {
			return NextResponse.json(
				{
					success: false,
					error: "Failed to store resume on cloud storage. Please try again.",
				},
				{ status: 500, headers: corsHeaders() }
			);
		}

		return NextResponse.json(
			{
				success: true,
				url: cloudinaryResult.secure_url,
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
