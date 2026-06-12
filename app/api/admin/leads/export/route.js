import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../../lib/auth";
import { filterAndSortLeads, leadsToCsv } from "../../../../../lib/leadUtils";
import { listLeads } from "../../../../../lib/store";

export async function GET(request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login", request.url), 303);

  const params = request.nextUrl.searchParams;
  const leads = filterAndSortLeads(await listLeads(), {
    query: params.get("q"),
    city: params.get("city"),
    category: params.get("category"),
    source: params.get("source"),
    enrichmentStatus: params.get("enrichmentStatus"),
    outreachStatus: params.get("outreachStatus"),
    pipelineStatus: params.get("pipelineStatus"),
    sort: params.get("sort")
  });

  return new NextResponse(leadsToCsv(leads), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-export.csv"`
    }
  });
}
