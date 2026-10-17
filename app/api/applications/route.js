import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { corsHeaders } from "@/lib/cors";
import { getAuthUserFromRequest } from "@/lib/auth";

export async function OPTIONS() {
	return new Response(null, {
		status: 200,
		headers: corsHeaders(),
	});
}

// GET /api/applications -> List candidate applications (Protected: HR only)
export async function GET(request) {
	try {
		const authUser = await getAuthUserFromRequest(request);
		if (!authUser) {
			return NextResponse.json(
				{ success: false, error: "Unauthorized access. Valid token required." },
				{ status: 401, headers: corsHeaders() }
			);
		}

		const { searchParams } = new URL(request.url);
		const jobId = searchParams.get("jobId");
		const status = searchParams.get("status");

		const where = {};
		if (jobId) where.jobId = jobId;
		if (status && status !== "all") where.status = status;

		const applications = await prisma.application.findMany({
			where,
			include: {
				job: {
					select: {
						id: true,
						title: true,
						department: true,
						location: true,
						screeningQuestions: true,
					},
				},
			},
			orderBy: {
				appliedAt: "desc",
			},
		});

		const formatted = applications.map((app) => {
			let city = app.city || app.currentLocation || "Not specified";
			let experience = app.experience || app.experienceYears || "Not specified";
			let noticePeriod = app.noticePeriod || "Not specified";
			let currentCtc = app.currentCtc || "N/A";
			let expectedCtc = app.expectedCtc || "N/A";
			let portfolioUrl = app.portfolioUrl || "";
			let linkedinUrl = app.linkedinUrl || "";

			// Backfill / parse from coverNote if fields are empty
			if (app.coverNote) {
				const parts = app.coverNote.split("|").map((p) => p.trim());
				for (const part of parts) {
					const colonIdx = part.indexOf(":");
					if (colonIdx === -1) continue;
					const key = part.slice(0, colonIdx).trim().toLowerCase();
					const val = part.slice(colonIdx + 1).trim();
					if (!val) continue;

					if (
						key.includes("notice") &&
						(!noticePeriod || noticePeriod === "Not specified" || noticePeriod === "N/A")
					) {
						noticePeriod = val;
					} else if (
						key.includes("current ctc") &&
						(!currentCtc || currentCtc === "N/A")
					) {
						currentCtc = val;
					} else if (
						key.includes("expected ctc") &&
						(!expectedCtc || expectedCtc === "N/A")
					) {
						expectedCtc = val;
					} else if (key.includes("portfolio") && !portfolioUrl) {
						portfolioUrl = val;
					} else if (key.includes("linkedin") && !linkedinUrl) {
						linkedinUrl = val;
					}
				}
			}

			return {
				...app,
				city,
				experience,
				noticePeriod,
				currentCtc,
				expectedCtc,
				portfolioUrl,
				linkedinUrl,
				jobTitle: app.job?.title || "Unknown Role",
				screeningAnswers: app.answers || {},
			};
		});

		return NextResponse.json(
			{ success: true, data: formatted },
			{ headers: corsHeaders() }
		);
	} catch (error) {
		console.error("GET /api/applications error:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch applications" },
			{ status: 500, headers: corsHeaders() }
		);
	}
}

// POST /api/applications -> Submit candidate application
export async function POST(request) {
	try {
		const body = await request.json();
		const {
			jobId,
			fullName,
			email,
			phone,
			city,
			currentLocation,
			experience,
			experienceYears,
			noticePeriod,
			currentCtc,
			expectedCtc,
			portfolioUrl,
			linkedinUrl,
			resumeUrl,
			coverNote,
			notes,
			answers,
		} = body;

		if (!jobId || !fullName || !email || !phone) {
			return NextResponse.json(
				{ success: false, error: "Job ID, name, email, and phone are required." },
				{ status: 400, headers: corsHeaders() }
			);
		}

		const normalizedEmail = email.trim().toLowerCase();
		if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(normalizedEmail)) {
			return NextResponse.json(
				{ success: false, error: "Please provide a valid email address." },
				{ status: 400, headers: corsHeaders() }
			);
		}

		const cleanPhone = phone.replace(/\D/g, "");
		let phone10 = cleanPhone;
		if (cleanPhone.length === 12 && cleanPhone.startsWith("91")) {
			phone10 = cleanPhone.slice(2);
		} else if (cleanPhone.length === 11 && cleanPhone.startsWith("0")) {
			phone10 = cleanPhone.slice(1);
		} else if (cleanPhone.length === 13 && cleanPhone.startsWith("910")) {
			phone10 = cleanPhone.slice(3);
		}

		const isRepetitive = /^(\d)\1{9}$/.test(phone10);

		if (
			phone10.length !== 10 ||
			!/^[6-9]\d{9}$/.test(phone10) ||
			isRepetitive
		) {
			return NextResponse.json(
				{
					success: false,
					error:
						"Please provide a valid 10-digit mobile number starting with 6, 7, 8, or 9.",
				},
				{ status: 400, headers: corsHeaders() }
			);
		}

		// Verify that the job exists and is currently active
		const targetJob = await prisma.job.findUnique({
			where: { id: jobId },
			select: { id: true, status: true, title: true },
		});

		if (!targetJob || targetJob.status !== "active") {
			return NextResponse.json(
				{
					success: false,
					error: "This position is currently inactive or no longer accepting applications.",
				},
				{ status: 400, headers: corsHeaders() }
			);
		}

		// Check if application already exists for this exact job posting with same email or phone
		const existingApp = await prisma.application.findFirst({
			where: {
				jobId,
				OR: [
					{ email: normalizedEmail },
					{ phone: { contains: phone10 } },
				],
			},
			select: {
				id: true,
				fullName: true,
				appliedAt: true,
				status: true,
			},
		});

		if (existingApp) {
			return NextResponse.json(
				{
					success: false,
					alreadyApplied: true,
					error: "You have already applied for this position.",
					appliedAt: existingApp.appliedAt,
					status: existingApp.status,
				},
				{ status: 409, headers: corsHeaders() }
			);
		}

		const newApp = await prisma.application.create({
			data: {
				jobId,
				fullName: fullName.trim(),
				email: normalizedEmail,
				phone: phone.trim(),
				city: city?.trim() || currentLocation?.trim() || "",
				currentLocation: currentLocation?.trim() || city?.trim() || "",
				experience: experience?.trim() || experienceYears?.trim() || "",
				experienceYears: experienceYears?.trim() || experience?.trim() || "",
				noticePeriod: noticePeriod?.trim() || "",
				currentCtc: currentCtc?.trim() || "",
				expectedCtc: expectedCtc?.trim() || "",
				portfolioUrl: portfolioUrl?.trim() || "",
				linkedinUrl: linkedinUrl?.trim() || "",
				resumeUrl: resumeUrl?.trim() || "",
				coverNote: coverNote?.trim() || "",
				notes: notes?.trim() || "",
				answers: answers || {},
				status: "applied",
			},
		});

		return NextResponse.json(
			{ success: true, data: newApp },
			{ status: 201, headers: corsHeaders() }
		);
	} catch (error) {
		console.error("POST /api/applications error:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to submit application" },
			{ status: 500, headers: corsHeaders() }
		);
	}
}
