import { Router } from "express";
import jwt from "jsonwebtoken";

const router = Router();

const EXPIRES_IN_SECONDS = 8 * 60 * 60;

const VALID_ROLES = new Set([
  "emergency",
  "doctor",
  "citizen",
  "admin",
  "lab",
  "pharmacy",
  "hospital",
  "insurance",
  "ai-control",
  "research",
  "family",
  "supply-chain",
]);

const ROLE_PROFILES: Record<string, { name: string; jobTitle: string; organization: string }> = {
  emergency: { name: "Unit 7 - Riyadh Central", jobTitle: "First Responder", organization: "SRCA Emergency Services" },
  doctor: { name: "Dr. Ahmed Al-Rashidi", jobTitle: "Consultant Physician", organization: "King Fahd Medical City" },
  citizen: { name: "Mohammed Al-Ghamdi", jobTitle: "Citizen", organization: "National Health Record" },
  admin: { name: "Eng. Saad Al-Otaibi", jobTitle: "National Health Operations Director", organization: "Ministry of Health - KSA" },
  lab: { name: "Sara Al-Otaibi", jobTitle: "Senior Lab Technician", organization: "SANAD Lab Network" },
  pharmacy: { name: "Hassan Al-Ghamdi", jobTitle: "Clinical Pharmacist", organization: "Central Pharmacy - Riyadh" },
  hospital: { name: "Operations Manager", jobTitle: "Hospital Operations Director", organization: "King Fahd Medical City" },
  insurance: { name: "Nora Al-Qahtani", jobTitle: "Insurance Operations Lead", organization: "Tawuniya Insurance" },
  "ai-control": { name: "Dr. Khalid Al-Mansouri", jobTitle: "AI Systems Lead", organization: "SANAD AI Division" },
  research: { name: "Dr. Reem Al-Zahrani", jobTitle: "Clinical Research Director", organization: "King Abdulaziz University" },
  family: { name: "Fatima Al-Harbi", jobTitle: "Family Health Coordinator", organization: "SANAD Family Health" },
  "supply-chain": { name: "Ibrahim Al-Dosari", jobTitle: "Supply Chain Manager", organization: "National Pharma Supply" },
};

type LoginBody = {
  role?: unknown;
};

router.post("/login", (req, res) => {
  const { role } = req.body as LoginBody;

  if (typeof role !== "string" || !VALID_ROLES.has(role)) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Valid role is required",
    });
  }

  const secret = process.env["JWT_SECRET"];
  if (!secret) {
    return res.status(500).json({
      error: "Server Configuration Error",
      message: "JWT secret is not configured",
    });
  }

  const token = jwt.sign({ role }, secret, { expiresIn: EXPIRES_IN_SECONDS });
  const profile = ROLE_PROFILES[role];

  return res.json({
    token,
    expiresIn: EXPIRES_IN_SECONDS,
    user: {
      role,
      name: profile.name,
      jobTitle: profile.jobTitle,
      organization: profile.organization,
    },
  });
});

export default router;
