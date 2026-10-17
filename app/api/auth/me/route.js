import { NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { corsHeaders } from "@/lib/cors";

export async function OPTIONS() {
	return new Response(null, {
		status: 200,
		headers: corsHeaders(),
	});
}

// GET /api/auth/me -> Returns current authenticated user profile
export async function GET(request) {
	try {
		const user = await getAuthUserFromRequest(request);

		if (!user) {
			return NextResponse.json(
				{ success: false, error: "Unauthorized" },
				{ status: 401, headers: corsHeaders() }
			);
		}

		return NextResponse.json(
			{
				success: true,
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
					role: user.role,
				},
			},
			{
				status: 200,
				headers: corsHeaders(),
			}
		);
	} catch (error) {
		console.error("GET /api/auth/me error:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to verify session" },
			{ status: 500, headers: corsHeaders() }
		);
	}
}
