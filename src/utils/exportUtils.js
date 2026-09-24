/**
 * Utility to export JavaScript array objects to CSV format and trigger browser download.
 * @param {Array<Object>} data - The dataset to export
 * @param {string} filename - Desired CSV file name
 */
export const exportToCSV = (data, filename = 'export_pascall.csv') => {
  if (!data || !data.length) {
    alert('Tidak ada data untuk diexport.');
    return false;
  }

  // Extract keys for CSV headers
  const headers = Object.keys(data[0]);
  
  const csvRows = [];
  // Add Header Row
  csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

  // Add Data Rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      const valString = val === null || val === undefined ? '' : String(val);
      return `"${valString.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  
  // Create virtual link to download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  return true;
};
