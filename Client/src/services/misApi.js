/**
 * misApi.js
 * Frontend service layer for all MIS reporting API calls.
 * All requests are authenticated via HTTP-only cookie (set on login).
 */

const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `API error ${res.status}`);
  return data;
}

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

export const authApi = {
  /** Returns logged-in user from JWT cookie */
  me: () => apiFetch("/api/me"),

  logout: () => apiFetch("/api/admin/logout", { method: "POST" }),
};

// ─────────────────────────────────────────────
// MASTER DATA
// ─────────────────────────────────────────────

export const masterApi = {
  regions:        () => apiFetch("/api/regions"),
  adOffices:      (regionId) => apiFetch(`/api/ad-offices${regionId ? `?region_id=${regionId}` : ""}`),
  financialYears: () => apiFetch("/api/financial-years"),
  months:         () => apiFetch("/api/months"),
  schemes:        () => apiFetch("/api/schemes"),
};

// ─────────────────────────────────────────────
// TARGETS
// ─────────────────────────────────────────────

export const targetApi = {
  upsert: (body) =>
    apiFetch("/api/targets", { method: "POST", body: JSON.stringify(body) }),

  get: ({ officeId, schemeId, financialYearId }) =>
    apiFetch(`/api/targets?officeId=${officeId}&schemeId=${schemeId}&financialYearId=${financialYearId}`),
};

// ─────────────────────────────────────────────
// MIS REPORTS
// ─────────────────────────────────────────────

export const misReportApi = {
  /**
   * Load a single office+scheme+year+month report.
   * ULM is auto-populated from previous month UM by the server.
   */
  loadReport: ({ officeName, schemeName, yearName, monthName }) =>
    apiFetch(
      `/api/monthly-report?office_name=${encodeURIComponent(officeName)}&scheme_name=${encodeURIComponent(schemeName)}&year_name=${encodeURIComponent(yearName)}&month_name=${encodeURIComponent(monthName)}`
    ),

  /**
   * Admin: load all offices for a scheme+year+month.
   */
  loadAllOffices: ({ schemeName, yearName, monthName }) =>
    apiFetch(
      `/api/monthly-report/all?scheme_name=${encodeURIComponent(schemeName)}&year_name=${encodeURIComponent(yearName)}&month_name=${encodeURIComponent(monthName)}`
    ),

  /**
   * Save a single office report (DM values only — server computes UM).
   */
  save: ({ officeName, schemeName, yearName, monthName, dmAcre, dmFarmer, status = "Draft" }) =>
    apiFetch("/api/mis-report", {
      method: "POST",
      body: JSON.stringify({
        office_name: officeName,
        scheme_name: schemeName,
        year_name:   yearName,
        month_name:  monthName,
        dm_acre:     dmAcre,
        dm_farmer:   dmFarmer,
        status,
      }),
    }),

  /**
   * Admin: save all offices at once.
   * rows: [{ adOffice, dm_acre, dm_farmer }]
   */
  saveBulk: ({ rows, schemeName, yearName, monthName, status = "Draft" }) =>
    apiFetch("/api/mis-report/bulk", {
      method: "POST",
      body: JSON.stringify({ rows, scheme_name: schemeName, year_name: yearName, month_name: monthName, status }),
    }),

  /**
   * Update report status (Approve / Reject).
   */
  updateStatus: (reportId, status) =>
    apiFetch(`/api/mis-report/${reportId}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  /**
   * List reports with optional filters.
   */
  list: ({ schemeId, yearId, monthId, officeId, status, limit, offset } = {}) => {
    const params = new URLSearchParams();
    if (schemeId)  params.set("scheme_id", schemeId);
    if (yearId)    params.set("year_id",   yearId);
    if (monthId)   params.set("month_id",  monthId);
    if (officeId)  params.set("office_id", officeId);
    if (status)    params.set("status",    status);
    if (limit)     params.set("limit",     limit);
    if (offset)    params.set("offset",    offset);
    return apiFetch(`/api/mis-report?${params}`);
  },
};

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────

export const dashboardApi = {
  summary: ({ schemeId, yearId } = {}) => {
    const params = new URLSearchParams();
    if (schemeId) params.set("scheme_id", schemeId);
    if (yearId)   params.set("year_id",   yearId);
    return apiFetch(`/api/dashboard-summary?${params}`);
  },

  submissionStatus: ({ schemeId, yearId, monthId }) =>
    apiFetch(`/api/submission-status?scheme_id=${schemeId}&year_id=${yearId}&month_id=${monthId}`),
};
