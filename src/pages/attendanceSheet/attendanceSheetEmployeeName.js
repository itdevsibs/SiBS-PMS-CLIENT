// Attendance Sheet display only. Never treat an account label as a person name.
function normalizedLabel(value) {
  return String(value ?? "").trim().replace(/[\s_-]+/g, " ").toLowerCase();
}

function validName(value, accountName) {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/g, " ");
  if (!name || /^(?:n\/?a|null|unknown|undefined|[-—]+)$/i.test(name)) return null;
  if (normalizedLabel(name) === normalizedLabel(accountName) ||
      ["us visa", "team leaders"].includes(normalizedLabel(name))) return null;
  return name;
}

function readPath(row, path) {
  return path.split(".").reduce((value, key) => value?.[key], row);
}

export function getAttendanceEmployeeName(row, accountName = null) {
  if (!row || typeof row !== "object") return "—";
  const knownAccount = accountName || row.accountName || row.kronosAccountName || null;
  // Explicit employee fields only: never use generic `name` or a suffix match
  // because that would accidentally return `accountName` (e.g. "US Visa").
  for (const field of [
    "employeeName", "employee_name", "employee_full_name", "gy_emp_fullname",
    "gy_emp_name", "emp_name", "full_name",
    "employee.employeeName", "employee.employee_name",
    "employee.gy_emp_fullname", "employee.full_name",
  ]) {
    const name = validName(readPath(row, field), knownAccount);
    if (name) return name;
  }

  const first = validName(row.first_name ?? row.firstname ?? row.gy_emp_fname ??
    row.employee?.gy_emp_fname, knownAccount);
  const last = validName(row.last_name ?? row.lastname ?? row.gy_emp_lname ??
    row.employee?.gy_emp_lname, knownAccount);
  if (first && last) {
    const middle = validName(row.middle_name ?? row.middlename ?? row.gy_emp_mname ??
      row.employee?.gy_emp_mname, knownAccount);
    return [first, middle, last].filter(Boolean).join(" ");
  }
  return "—";
}
