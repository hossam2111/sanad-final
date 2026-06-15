import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { validate } from "../middlewares/validate.js";
import { writeAudit, extractRequestMeta } from "../lib/audit.js";

const router = Router();

const EXPIRES_IN_SECONDS = 8 * 60 * 60;
const AUTH_ERROR = {
  SERVER_CONFIGURATION: "Authentication service is not configured for this environment",
} as const;

const VALID_ROLES = [
  "emergency", "doctor", "citizen", "admin", "lab",
  "pharmacy", "hospital", "insurance", "ai-control",
  "research", "family", "supply-chain",
] as const;

type ValidRole = typeof VALID_ROLES[number];

const loginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(6).max(200),
});

interface UserCredential {
  role: ValidRole;
  name: string;
  userId: string;
  jobTitle: string;
  organization: string;
  nationalId?: string;
}

// Demo credential store — production replaces this with Absher / LDAP / SSO.
// Passwords are shown plaintext here only because this is a demo system with no
// real patient data. A real deployment uses bcrypt + a proper identity provider.
const CREDENTIALS: Record<string, UserCredential> = {
  "emergency_unit7":    { role: "emergency",     userId: "EMP-001", name: "Unit 7 - Riyadh Central",           jobTitle: "First Responder",               organization: "SRCA Emergency Services",   password: "Emergency@2026" } as UserCredential & { password: string },
  "dr.rashidi":         { role: "doctor",         userId: "DOC-001", name: "Dr. Ahmed Al-Rashidi",              jobTitle: "Consultant Physician",           organization: "King Fahd Medical City",    password: "Doctor@2026" } as UserCredential & { password: string },
  "citizen_demo":       { role: "citizen",        userId: "CIT-001", name: "Mohammed Al-Ghamdi",                jobTitle: "Citizen",                        organization: "National Health Record",    nationalId: "1000000001", password: "Citizen@2026" } as UserCredential & { password: string },
  "admin.saad":         { role: "admin",          userId: "ADM-001", name: "Eng. Saad Al-Otaibi",               jobTitle: "National Health Ops Director",   organization: "Ministry of Health - KSA",  password: "Admin@2026" } as UserCredential & { password: string },
  "lab.sara":           { role: "lab",            userId: "LAB-001", name: "Sara Al-Otaibi",                    jobTitle: "Senior Lab Technician",          organization: "SANAD Lab Network",         password: "Lab@2026" } as UserCredential & { password: string },
  "pharm.hassan":       { role: "pharmacy",       userId: "PHA-001", name: "Hassan Al-Ghamdi",                  jobTitle: "Clinical Pharmacist",            organization: "Central Pharmacy - Riyadh", password: "Pharmacy@2026" } as UserCredential & { password: string },
  "hosp.ops":           { role: "hospital",       userId: "HOS-001", name: "Operations Manager",                jobTitle: "Hospital Ops Director",          organization: "King Fahd Medical City",    password: "Hospital@2026" } as UserCredential & { password: string },
  "ins.nora":           { role: "insurance",      userId: "INS-001", name: "Nora Al-Qahtani",                   jobTitle: "Insurance Operations Lead",      organization: "Tawuniya Insurance",        password: "Insurance@2026" } as UserCredential & { password: string },
  "ai.khalid":          { role: "ai-control",     userId: "AIC-001", name: "Dr. Khalid Al-Mansouri",            jobTitle: "AI Systems Lead",                organization: "SANAD AI Division",         password: "AiControl@2026" } as UserCredential & { password: string },
  "research.reem":      { role: "research",       userId: "RES-001", name: "Dr. Reem Al-Zahrani",               jobTitle: "Clinical Research Director",     organization: "King Abdulaziz University", password: "Research@2026" } as UserCredential & { password: string },
  // Cast coherence: Fatima is محمد الغامدي's wife (patient 1000000001) — the
  // family scenario is her viewing his record under family_linking consent.
  "family.fatima":      { role: "family",         userId: "FAM-001", name: "Fatima Al-Ghamdi",                  jobTitle: "Family Member",                  organization: "Al-Ghamdi Household",       password: "Family@2026" } as UserCredential & { password: string },
  "supply.ibrahim":     { role: "supply-chain",   userId: "SUP-001", name: "Ibrahim Al-Dosari",                 jobTitle: "Supply Chain Manager",           organization: "National Pharma Supply",    password: "Supply@2026" } as UserCredential & { password: string },
};

// Index also by userId for token lookup
const CREDENTIALS_BY_USER = Object.values(CREDENTIALS) as (UserCredential & { password: string })[];

function isDemoAuthEnabled(): boolean {
  if (process.env["DEMO_AUTH_ENABLED"] === "true") return true;
  if (process.env["DEMO_AUTH_ENABLED"] === "false") return false;
  return process.env["NODE_ENV"] !== "production";
}

function hasProductionAuthProvider(): boolean {
  return Boolean(process.env["AUTH_PROVIDER"] && process.env["AUTH_PROVIDER"] !== "demo") ||
    process.env["REAL_AUTH_PROVIDER_CONFIGURED"] === "true";
}

export function assertAuthPosture(): void {
  if (process.env["NODE_ENV"] === "production" && !isDemoAuthEnabled() && !hasProductionAuthProvider()) {
    throw new Error(AUTH_ERROR.SERVER_CONFIGURATION);
  }
}

router.post("/login", validate(loginSchema), async (req, res) => {
  const { username, password } = req.body as z.infer<typeof loginSchema>;

  const secret = process.env["JWT_SECRET"];
  if (!secret) {
    return res.status(500).json({
      error: "SERVER_CONFIGURATION_ERROR",
      message: "Authentication service not configured",
    });
  }

  if (!isDemoAuthEnabled()) {
    return res.status(503).json({
      error: "AUTH_PROVIDER_UNAVAILABLE",
      message: AUTH_ERROR.SERVER_CONFIGURATION,
    });
  }

  const user = CREDENTIALS[username] as (UserCredential & { password: string }) | undefined;
  if (!user || user.password !== password) {
    return res.status(401).json({
      error: "INVALID_CREDENTIALS",
      message: "Invalid username or password",
    });
  }

  const payload: Record<string, string> = {
    role: user.role,
    userId: user.userId,
    userName: user.name,
    username: username,
  };
  if (user.nationalId) payload["nationalId"] = user.nationalId;

  const token = jwt.sign(payload, secret, { expiresIn: EXPIRES_IN_SECONDS });
  const { ipAddress, userAgent } = extractRequestMeta(req);

  await writeAudit({
    who: user.userId,
    whoName: user.name,
    whoRole: user.role,
    action: "LOGIN",
    what: `User login: ${user.name} (${user.role})`,
    details: { userId: user.userId, username },
    ipAddress,
    userAgent,
  });

  return res.json({
    token,
    expiresIn: EXPIRES_IN_SECONDS,
    user: {
      role: user.role,
      userId: user.userId,
      name: user.name,
      jobTitle: user.jobTitle,
      organization: user.organization,
    },
  });
});

export default router;
