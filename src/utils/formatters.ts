import { format, parseISO } from "date-fns";

/**
 * Formats a salary/stipend number or string in LPA (Lakhs Per Annum) or Lakhs / Monthly Indian format.
 * E.g., "1200000" => "₹12 LPA"
 * "30000" => "₹30,000 / month"
 */
export const formatIndianSalary = (salaryStr?: string, jobType?: string): string => {
  if (!salaryStr) return "Not Specified";
  
  // Clean string
  const cleaned = salaryStr.replace(/[^0-9]/g, "");
  if (!cleaned) return salaryStr; // fallback if it has custom characters
  
  const num = parseInt(cleaned, 10);
  
  if (jobType === "internship") {
    return `₹${num.toLocaleString("en-IN")} / month`;
  }
  
  if (num >= 100000) {
    const lpa = num / 100000;
    return `₹${lpa.toFixed(1).replace(/\.0$/, "")} LPA`;
  }
  
  return `₹${num.toLocaleString("en-IN")}`;
};

/**
 * Formats a ISO date string to Indian DD/MM/YYYY format.
 */
export const formatDateIndian = (dateStr?: string | Date): string => {
  if (!dateStr) return "-";
  try {
    const date = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
    return format(date, "dd/MM/yyyy");
  } catch (err) {
    return typeof dateStr === "string" ? dateStr : "-";
  }
};
