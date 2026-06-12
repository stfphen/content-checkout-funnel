import { redirect } from "next/navigation";
import { getAdminSession } from "../../lib/auth";
import {
  listContractors,
  listDraftEmails,
  listLeads,
  listTenants
} from "../../lib/store";
import AdminDashboard from "../../components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

const statuses = [
  "new",
  "researched",
  "drafted",
  "approved",
  "sent_external",
  "replied",
  "booked",
  "won",
  "lost",
  "do_not_contact"
];

export default async function AdminPage({ searchParams }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const params = await searchParams;
  const notice = params?.notice;

  const [tenants, leads, contractors, drafts] = await Promise.all([
    listTenants(),
    listLeads(),
    listContractors(),
    listDraftEmails()
  ]);

  const leadCounts = statuses.map((status) => ({
    status,
    count: leads.filter((lead) => lead.status === status).length
  }));

  return (
    <AdminDashboard 
      tenants={tenants}
      leads={leads}
      contractors={contractors}
      drafts={drafts}
      statuses={statuses}
      leadCounts={leadCounts}
      notice={notice}
    />
  );
}
