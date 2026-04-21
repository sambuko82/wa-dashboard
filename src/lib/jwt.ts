import { SignJWT, jwtVerify } from "jose";

const getSecret = () =>
  new TextEncoder().encode(
    process.env.JWT_SECRET ?? "wa-dashboard-fallback-secret-32chars!!"
  );

export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  role: "ADMIN" | "USER";
  isJvto: boolean;
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}
