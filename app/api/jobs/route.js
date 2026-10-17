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

// GET /api/jobs -> List all jobs with application count
export async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);
		const status = searchParams.get("status");

		const where = {};
		if (status && status !== "all") {
			where.status = status;
		}

		const jobs = await prisma.job.findMany({
			where,
			include: {
				_count: {
					select: { applications: true },
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		// Map to format expected by UI
		const formatted = jobs.map((job) => ({
			...job,
			applicationsCount: job._count?.applications || 0,
		}));

		return NextResponse.json(
			{ success: true, data: formatted },
			{ headers: corsHeaders() }
		);
	} catch (error) {
		console.error("GET /api/jobs error:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch jobs" },
			{ status: 500, headers: corsHeaders() }
		);
	}
}

// POST /api/jobs -> Create a new job opening (Protected: HR only)
export async function POST(request) {
	try {
		const authUser = await getAuthUserFromRequest(request);
		if (!authUser) {
			return NextResponse.json(
				{ success: false, error: "Unauthorized access. Valid token required." },
				{ status: 401, headers: corsHeaders() }
			);
		}

		const body = await request.json();
		const {
			title,
			department,
			location,
			type,
			experience,
			salary,
			status,
			overview,
			responsibilities,
			requirements,
			benefits,
			screeningQuestions,
		} = body;

		if (!title || !location) {
			return NextResponse.json(
				{ success: false, error: "Job title and location are required." },
				{ status: 400, headers: corsHeaders() }
			);
		}

		const newJob = await prisma.job.create({
			data: {
				title: title.trim(),
				department: department?.trim() || "General",
				location: location.trim(),
				type: type || "Full-time",
				experience: experience?.trim() || "",
				salary: salary?.trim() || "",
				status: status || "active",
				overview: overview?.trim() || "",
				responsibilities: responsibilities || [],
				requirements: requirements || [],
				benefits: benefits || [],
				screeningQuestions: screeningQuestions || [],
			},
		});

		return NextResponse.json(
			{ success: true, data: newJob },
			{ status: 201, headers: corsHeaders() }
		);
	} catch (error) {
		console.error("POST /api/jobs error:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to create job opening" },
			{ status: 500, headers: corsHeaders() }
		);
	}
}
