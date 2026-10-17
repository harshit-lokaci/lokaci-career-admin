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

// GET /api/jobs/[id]
export async function GET(request, { params }) {
	try {
		const { id } = await params;
		const { searchParams } = new URL(request.url);
		const status = searchParams.get("status");

		const job = await prisma.job.findUnique({
			where: { id },
			include: {
				applications: true,
			},
		});

		if (!job) {
			return NextResponse.json(
				{ success: false, error: "Job not found" },
				{ status: 404, headers: corsHeaders() }
			);
		}

		// If a specific status is requested (e.g. ?status=active) and does not match, return 404
		if (status && status !== "all" && job.status !== status) {
			return NextResponse.json(
				{ success: false, error: "Job is inactive or not available" },
				{ status: 404, headers: corsHeaders() }
			);
		}

		return NextResponse.json(
			{ success: true, data: job },
			{ headers: corsHeaders() }
		);
	} catch (error) {
		console.error("GET /api/jobs/[id] error:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch job" },
			{ status: 500, headers: corsHeaders() }
		);
	}
}

// PUT /api/jobs/[id] -> Full update (Protected: HR only)
export async function PUT(request, { params }) {
	try {
		const authUser = await getAuthUserFromRequest(request);
		if (!authUser) {
			return NextResponse.json(
				{ success: false, error: "Unauthorized access" },
				{ status: 401, headers: corsHeaders() }
			);
		}

		const { id } = await params;
		const body = await request.json();

		const updated = await prisma.job.update({
			where: { id },
			data: {
				title: body.title?.trim(),
				department: body.department?.trim(),
				location: body.location?.trim(),
				type: body.type,
				experience: body.experience?.trim(),
				salary: body.salary?.trim(),
				status: body.status,
				overview: body.overview?.trim(),
				responsibilities: body.responsibilities || [],
				requirements: body.requirements || [],
				benefits: body.benefits || [],
				screeningQuestions: body.screeningQuestions || [],
			},
		});

		return NextResponse.json(
			{ success: true, data: updated },
			{ headers: corsHeaders() }
		);
	} catch (error) {
		console.error("PUT /api/jobs/[id] error:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to update job" },
			{ status: 500, headers: corsHeaders() }
		);
	}
}

// PATCH /api/jobs/[id] -> Toggle status or partial update (Protected: HR only)
export async function PATCH(request, { params }) {
	try {
		const authUser = await getAuthUserFromRequest(request);
		if (!authUser) {
			return NextResponse.json(
				{ success: false, error: "Unauthorized access" },
				{ status: 401, headers: corsHeaders() }
			);
		}

		const { id } = await params;
		const body = await request.json();

		const updated = await prisma.job.update({
			where: { id },
			data: body,
		});

		return NextResponse.json(
			{ success: true, data: updated },
			{ headers: corsHeaders() }
		);
	} catch (error) {
		console.error("PATCH /api/jobs/[id] error:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to update job status" },
			{ status: 500, headers: corsHeaders() }
		);
	}
}

// DELETE /api/jobs/[id] (Protected: HR only)
export async function DELETE(request, { params }) {
	try {
		const authUser = await getAuthUserFromRequest(request);
		if (!authUser) {
			return NextResponse.json(
				{ success: false, error: "Unauthorized access" },
				{ status: 401, headers: corsHeaders() }
			);
		}

		const { id } = await params;
		await prisma.job.delete({
			where: { id },
		});

		return NextResponse.json(
			{ success: true, message: "Job deleted successfully" },
			{ headers: corsHeaders() }
		);
	} catch (error) {
		console.error("DELETE /api/jobs/[id] error:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to delete job" },
			{ status: 500, headers: corsHeaders() }
		);
	}
}
