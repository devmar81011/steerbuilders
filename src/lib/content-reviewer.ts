import {
  company,
  story,
  vision,
  mission,
  services,
  management,
  portfolio,
} from "@/lib/company-content";
import { pdfCanonical } from "@/lib/pdf-canonical";

export type ReviewSeverity = "pass" | "warn" | "fail";

export type ReviewFinding = {
  id: string;
  area: string;
  severity: ReviewSeverity;
  message: string;
  expected?: string;
  actual?: string;
};

function normalize(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function compareField(
  id: string,
  area: string,
  expected: string,
  actual: string,
  exact = true
): ReviewFinding {
  const match = exact
    ? normalize(expected) === normalize(actual)
    : normalize(actual).includes(normalize(expected)) ||
      normalize(expected).includes(normalize(actual));

  return {
    id,
    area,
    severity: match ? "pass" : "fail",
    message: match ? "Matches PDF" : "Does not match PDF",
    expected: expected.slice(0, 120) + (expected.length > 120 ? "…" : ""),
    actual: actual.slice(0, 120) + (actual.length > 120 ? "…" : ""),
  };
}

/** Content reviewer agent — compares live site data against the company profile PDF */
export function runContentReview(): ReviewFinding[] {
  const findings: ReviewFinding[] = [];

  findings.push(
    compareField("company-name", "Company", pdfCanonical.company.name, company.name),
    compareField("company-mantra", "Company", pdfCanonical.company.mantra, company.mantra),
    compareField("company-address", "Company", pdfCanonical.company.address, company.address),
    compareField("company-phone", "Company", pdfCanonical.company.phone, company.phone),
    compareField("company-email", "Company", pdfCanonical.company.email, company.email),
    compareField("story-body", "Our Story", pdfCanonical.story.body, story.body),
    compareField("vision-body", "Vision", pdfCanonical.vision.body, vision.body),
    compareField("mission-body", "Mission", pdfCanonical.mission.body, mission.body)
  );

  pdfCanonical.services.forEach((serviceTitle, index) => {
    const actual = services[index]?.title ?? "";
    if (serviceTitle.startsWith("Other Services")) {
      const ok =
        actual.toLowerCase().includes("specialty") ||
        actual.toLowerCase().includes("plumbing");
      findings.push({
        id: `service-${index + 1}`,
        area: "Services",
        severity: ok ? "pass" : "warn",
        message: ok
          ? "Specialty trades maps to PDF other services"
          : "Service title should reflect PDF specialty trades list",
        expected: serviceTitle.slice(0, 80) + "…",
        actual,
      });
    } else {
      findings.push(
        compareField(`service-${index + 1}`, "Services", serviceTitle, actual)
      );
    }
  });

  pdfCanonical.management.forEach((leader, index) => {
    const actual = management[index];
    if (!actual) {
      findings.push({
        id: `mgmt-${index}`,
        area: "Management",
        severity: "fail",
        message: "Missing management entry",
        expected: leader.name,
      });
      return;
    }
    findings.push(
      compareField(`mgmt-name-${index}`, "Management", leader.name, actual.name),
      compareField(`mgmt-title-${index}`, "Management", leader.title, actual.title)
    );
  });

  findings.push({
    id: "portfolio-count",
    area: "Portfolio",
    severity:
      portfolio.length >= pdfCanonical.portfolioMinCount ? "pass" : "warn",
    message:
      portfolio.length >= pdfCanonical.portfolioMinCount
        ? `Portfolio has ${portfolio.length} projects (PDF minimum ${pdfCanonical.portfolioMinCount})`
        : `Portfolio has ${portfolio.length} projects — PDF lists at least ${pdfCanonical.portfolioMinCount}`,
    expected: String(pdfCanonical.portfolioMinCount),
    actual: String(portfolio.length),
  });

  const completed = portfolio.filter((p) => p.status === "Completed");
  findings.push({
    id: "portfolio-completed",
    area: "Portfolio",
    severity: completed.length > 0 ? "pass" : "warn",
    message: `${completed.length} completed projects in database/content`,
    actual: String(completed.length),
  });

  return findings;
}

export function getReviewSummary(findings: ReviewFinding[]) {
  return {
    total: findings.length,
    pass: findings.filter((f) => f.severity === "pass").length,
    warn: findings.filter((f) => f.severity === "warn").length,
    fail: findings.filter((f) => f.severity === "fail").length,
    aligned: findings.every((f) => f.severity !== "fail"),
  };
}
