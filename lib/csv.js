export function parseCsv(input) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field.trim());
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(field.trim());
      if (row.some(Boolean)) {
        rows.push(row);
      }
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  row.push(field.trim());
  if (row.some(Boolean)) {
    rows.push(row);
  }

  if (!rows.length) return [];

  const headers = rows[0].map((header) => header.toLowerCase().replace(/\s+/g, "_"));
  return rows.slice(1).map((values) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || "";
    });
    return record;
  });
}

export function leadFromCsvRecord(record, tenantId) {
  return {
    tenantId,
    business: record.business || record.company || record.name || "",
    name: record.contact || record.contact_name || record.owner || "",
    email: record.email || "",
    phone: record.phone || "",
    url: record.website || record.url || record.instagram || "",
    notes: record.notes || "",
    status: record.status || "new",
    sourceType: "csv",
    metadata: record
  };
}
