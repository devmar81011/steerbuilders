import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isSuperadminAuthenticated } from "@/lib/superadmin-auth";
import {
  getResetCounts,
  RESET_TARGETS,
  runOperationalReset,
  type ResetTarget,
} from "@/lib/superadmin-reset";

export async function GET() {
  if (!(await isSuperadminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const counts = await getResetCounts();
    return NextResponse.json({ counts });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load counts." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await isSuperadminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    targets?: string[];
    confirm?: string;
  } | null;

  if (!body || body.confirm !== "RESET") {
    return NextResponse.json(
      { error: 'Type RESET to confirm destructive cleanup.' },
      { status: 400 }
    );
  }

  const targets = (body.targets || []).filter((t): t is ResetTarget =>
    (RESET_TARGETS as readonly string[]).includes(t)
  );

  if (targets.length === 0) {
    return NextResponse.json(
      { error: "Select at least one thing to reset." },
      { status: 400 }
    );
  }

  try {
    const cleared = await runOperationalReset(targets);

    for (const path of [
      "/admin",
      "/admin/attendance",
      "/admin/payroll",
      "/admin/employees",
      "/admin/settings",
      "/admin/projects",
      "/projects",
      "/superadmin/tools",
    ]) {
      revalidatePath(path);
    }

    return NextResponse.json({ ok: true, cleared });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Reset failed." },
      { status: 500 }
    );
  }
}
