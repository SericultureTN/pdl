import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  },
});

export const MIS_SHEETS = [
  { id: 'plantation-overall', label: 'Plantation Overall' },
  { id: 'plantation-scheme-2024-25', label: 'Scheme 2024-25' },
  { id: 'plantation-scheme-2025-26', label: 'Scheme 2025-26' },
  { id: 'dfls-distribution', label: 'DFLs Distribution' },
  { id: 'dfls-consumption', label: 'DFLs Consumption' },
  { id: 'cocoon-production', label: 'Cocoon Production' },
];

export const FINANCIAL_YEARS = ['2024-25', '2025-26'];

export const FY_MONTHS = [
  'April', 'May', 'June', 'July', 'August', 'September',
  'October', 'November', 'December', 'January', 'February', 'March',
];

export const REGIONS = [
  'All Regions',
  'Dharmapuri Region',
  'Erode Region',
  'Vellore Region',
  'Trichy Region',
  'Madurai Region',
];

export async function fetchReport(params) {
  const response = await client.get('/report', { params });
  return response.data;
}

export async function saveDmData(payload) {
  const response = await client.post('/data/save', payload);
  return response.data;
}

export async function rolloverMonth(month, year) {
  const response = await client.post('/admin/rollover', null, { params: { month, year } });
  return response.data;
}

export async function exportExcel(params) {
  const response = await client.get('/export/excel', {
    params,
    responseType: 'blob',
  });
  return response.data;
}

export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
