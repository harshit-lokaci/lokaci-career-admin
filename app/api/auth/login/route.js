import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword, signJwt } from "@/lib/auth";
import { corsHeaders } from "@/lib/cors";

export async function OPTIONS() {
	return new Response(null, {
		status: 200,
		headers: corsHeaders(),
	});
}

// POST /api/auth/login
export async function POST(request) {
	try {
		const body = await request.json();
		const { email, password } = body;

		if (!email || !password) {
			return NextResponse.json(
				{ success: false, error: "Email and password are required." },
				{ status: 400, headers: corsHeaders() }
			);
		}

		const cleanEmail = email.trim().toLowerCase();

		// Fetch admin user (supports generated model or raw query fallback)
		let user = null;
		if (prisma.adminUser) {
			user = await prisma.adminUser.findUnique({
				where: { email: cleanEmail },
			});
		} else {
			const rows = await prisma.$queryRaw`
				SELECT id, email, "passwordHash", name, role
				FROM admin_users
				WHERE email = ${cleanEmail}
				LIMIT 1
			`;
			user = rows && rows.length > 0 ? rows[0] : null;
		}

		if (!user) {
			return NextResponse.json(
				{ success: false, error: "Invalid email or password." },
				{ status: 401, headers: corsHeaders() }
			);
		}

		const isPasswordValid = await verifyPassword(password, user.passwordHash);
		if (!isPasswordValid) {
			return NextResponse.json(
				{ success: false, error: "Invalid email or password." },
				{ status: 401, headers: corsHeaders() }
			);
		}

		// Generate 7-day JWT token
		const tokenPayload = {
			id: user.id,
			email: user.email,
			name: user.name,
			role: user.role,
		};

		const token = await signJwt(tokenPayload, "7d");

		return NextResponse.json(
			{
				success: true,
				message: "Authentication successful",
				token,
				user: tokenPayload,
				expiresIn: "7d",
			},
			{
				status: 200,
				headers: corsHeaders(),
			}
		);
	} catch (error) {
		console.error("POST /api/auth/login error:", error);
		return NextResponse.json(
			{ success: false, error: "An unexpected error occurred during login." },
			{ status: 500, headers: corsHeaders() }
		);
	}
}
