import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const getSecretKey = () => {
	const secret =
		process.env.JWT_SECRET ||
		"lokaci-admin-jwt-secret-key-prod-2026-super-secure-change-in-env";
	return new TextEncoder().encode(secret);
};

// --- Password Hashing & Verification ---
export async function hashPassword(plainPassword) {
	const saltRounds = 10;
	return await bcrypt.hash(plainPassword, saltRounds);
}

export async function verifyPassword(plainPassword, hashedPassword) {
	return await bcrypt.compare(plainPassword, hashedPassword);
}

// --- JWT Token Generation & Verification ---
export async function signJwt(payload, expiresIn = "7d") {
	const secretKey = getSecretKey();
	return await new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime(expiresIn)
		.sign(secretKey);
}

export async function verifyJwt(token) {
	try {
		if (!token) return null;
		const secretKey = getSecretKey();
		const { payload } = await jwtVerify(token, secretKey);
		return payload;
	} catch (err) {
		return null;
	}
}

// --- Extract and Verify User from Incoming Request ---
export async function getAuthUserFromRequest(request) {
	try {
		const authHeader = request.headers.get("authorization");
		if (authHeader && authHeader.startsWith("Bearer ")) {
			const token = authHeader.substring(7).trim();
			if (token) {
				return await verifyJwt(token);
			}
		}

		// Optional fallback: Check cookie if present
		const cookieHeader = request.headers.get("cookie");
		if (cookieHeader) {
			const cookies = Object.fromEntries(
				cookieHeader
					.split(";")
					.map((c) => c.trim().split("="))
					.map(([k, ...v]) => [k, decodeURIComponent(v.join("="))])
			);
			if (cookies.lokaci_admin_token) {
				return await verifyJwt(cookies.lokaci_admin_token);
			}
		}

		return null;
	} catch (error) {
		console.error("Auth verification error:", error);
		return null;
	}
}
