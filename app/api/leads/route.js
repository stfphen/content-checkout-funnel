import { NextResponse } from "next/server";
import { createLead } from "../../../lib/store";

export async function POST(request) {
  const payload = await request.json();
  const lead = await createLead(payload);
  return NextResponse.json({ ok: true, lead });
}
