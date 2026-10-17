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

// PATCH /api/applications/[id] -> Update application status or HR notes (Protected)
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
		const { status, notes } = body;

		const updateData = {};
		if (status) updateData.status = status;
		if (notes !== undefined) updateData.notes = notes;

		const updated = await prisma.application.update({
			where: { id },
			data: updateData,
		});

		return NextResponse.json(
			{ success: true, data: updated },
			{ headers: corsHeaders() }
		);
	} catch (error) {
		console.error("PATCH /api/applications/[id] error:", error);
		return NextResponse.json(
			{ success: false, error: error.message || "Failed to update application" },
			{ status: 500, headers: corsHeaders() }
		);
	}
}

// DELETE /api/applications/[id] (Protected)
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
		await prisma.application.delete({
			where: { id },
		});

		return NextResponse.json(
			{ success: true, message: "Application deleted" },
			{ headers: corsHeaders() }
		);
	} catch (error) {
		console.error("DELETE /api/applications/[id] error:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to delete application" },
			{ status: 500, headers: corsHeaders() }
		);
	}
}
