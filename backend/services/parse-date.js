
// const parseDate = (dateStr, isEndDate = false) => {
//     if (!dateStr) return null;

//     // Parse as YYYY-MM-DD or ISO 8601
//     const date = new Date(dateStr);

//     // Check if date is valid
//     if (isNaN(date.getTime())) {
//         return null;
//     }

//     // Adjust time for YYYY-MM-DD format
//     if (isEndDate && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
//         date.setHours(23, 59, 59, 999); // End of day
//     } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
//         date.setHours(0, 0, 0, 0); // Start of day
//     }

//     return date;
// };
const parseDate = (dateStr, isEndDate = false) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;

  // Ensure UTC for YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day));
    if (isEndDate) {
      utcDate.setUTCHours(23, 59, 59, 999);
    } else {
      utcDate.setUTCHours(0, 0, 0, 0);
    }
    return utcDate;
  }
  return date;
};

export { parseDate };
