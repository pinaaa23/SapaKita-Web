import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Utility to export datasets to professional, neatly structured Excel (.xlsx) files.
 * Supports rich title banners, metadata, summary statistics, and auto-fitted columns.
 */
export const exportToExcel = (
  inputData,
  filename = 'export_sadewa.xlsx',
  sheetName = 'Data',
  options = {}
) => {
  // Support both array dataset or options object
  let data = inputData;
  let title = options.title || 'LAPORAN DATA SADEWA';
  let subtitle = options.subtitle || 'Sistem Layanan Komunikasi Pemasyarakatan';
  let metadata = options.metadata || {};
  let summaryMetrics = options.summaryMetrics || [];

  if (!data || !data.length) {
    alert('Tidak ada data untuk diekspor ke Excel.');
    return false;
  }

  try {
    const finalName = filename.toLowerCase().endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    const workbook = XLSX.utils.book_new();

    // 1. Build structured Array of Arrays (AOA) for clean presentation
    const aoa = [];

    // --- Header Banner ---
    aoa.push(['SADEWA INDONESIA']);
    aoa.push([title.toUpperCase()]);
    aoa.push([subtitle]);
    aoa.push([]); // blank separator

    // --- Metadata Rows ---
    const metaEntries = Object.entries(metadata).filter(([_, v]) => v !== undefined && v !== null && v !== '');
    if (metaEntries.length > 0) {
      metaEntries.forEach(([key, val]) => {
        aoa.push([key, val]);
      });
      aoa.push([]); // blank separator
    }

    // --- Summary Metrics (if available) ---
    if (summaryMetrics && summaryMetrics.length > 0) {
      aoa.push(['RINGKASAN METRIK']);
      summaryMetrics.forEach(m => {
        aoa.push([m.label, m.value]);
      });
      aoa.push([]); // blank separator
    }

    // --- Table Headers & Data Rows ---
    let headers = [];
    if (Array.isArray(data[0])) {
      // Data is already 2D array
      aoa.push(...data);
    } else if (typeof data[0] === 'object') {
      // Data is array of objects
      headers = Object.keys(data[0]).map(h => h.replace(/_/g, ' '));
      aoa.push(headers);

      data.forEach(item => {
        const row = Object.keys(item).map(key => {
          const val = item[key];
          return val === null || val === undefined ? '-' : val;
        });
        aoa.push(row);
      });
    }

    // 2. Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(aoa);

    // 3. Compute optimal column widths for clean readability
    const maxCols = Math.max(...aoa.map(r => r.length));
    const columnWidths = [];

    for (let c = 0; c < maxCols; c++) {
      let maxLen = 14;
      aoa.forEach(r => {
        const cellVal = r[c];
        if (cellVal !== undefined && cellVal !== null) {
          const str = String(cellVal);
          // Avoid excessively long banner rows skewing col 0
          if (str.length > maxLen && str.length < 60) {
            maxLen = str.length;
          }
        }
      });
      columnWidths.push({ wch: Math.min(Math.max(maxLen + 4, 15), 55) });
    }
    worksheet['!cols'] = columnWidths;

    // 4. Append sheet to workbook & save
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));
    XLSX.writeFile(workbook, finalName);
    return true;
  } catch (err) {
    console.error('[ExportUtils] Gagal mengekspor data ke Excel:', err);
    alert('Terjadi kesalahan saat mengekspor ke Excel.');
    return false;
  }
};

/**
 * Utility to export datasets to a professional, read-only PDF (.pdf) with official Kop & styling.
 */
export const exportToPDF = ({
  title = 'LAPORAN DATA SADEWA',
  subtitle = 'Sistem Manajemen Layanan Komunikasi Pemasyarakatan',
  filename = 'laporan_sadewa.pdf',
  headers = [],
  rows = [],
  tables = [], // Mendukung multi-tabel: [{ title, subtitle, headers, rows }]
  metadata = {},
  summaryMetrics = [],
  orientation = 'portrait' // 'portrait' | 'landscape'
}) => {
  const hasTables = Array.isArray(tables) && tables.some(t => t.rows && t.rows.length);
  if ((!rows || !rows.length) && !hasTables) {
    alert('Tidak ada data untuk diekspor ke PDF.');
    return false;
  }

  try {
    const doc = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    let currentY = 14;

    // --- 1. TOP HEADER ACCENT BAR ---
    doc.setFillColor(30, 58, 138); // Primary Navy #1e3a8a
    doc.rect(0, 0, pageWidth, 5, 'F');

    // --- 2. OFFICIAL KOP HEADER ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.text('SADEWA INDONESIA', margin, currentY + 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(title.toUpperCase(), margin, currentY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(subtitle, margin, currentY + 15);

    // Right header badge (Official Document)
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(pageWidth - margin - 45, currentY, 45, 14, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('DOKUMEN RESMI', pageWidth - margin - 22.5, currentY + 5.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('FORMAT PDF (TERKUNCI)', pageWidth - margin - 22.5, currentY + 10.5, { align: 'center' });

    currentY += 21;

    // Divider line
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.4);
    doc.line(margin, currentY, pageWidth - margin, currentY);

    currentY += 5;

    // --- 3. METADATA SECTION ---
    const metaEntries = Object.entries(metadata).filter(([_, v]) => v !== undefined && v !== null && v !== '');
    if (metaEntries.length > 0) {
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240);
      const metaBoxHeight = Math.ceil(metaEntries.length / 2) * 5 + 6;
      doc.roundedRect(margin, currentY, pageWidth - (margin * 2), metaBoxHeight, 2, 2, 'FD');

      let metaY = currentY + 4.5;
      metaEntries.forEach(([key, val], idx) => {
        const isLeft = idx % 2 === 0;
        const xPos = isLeft ? margin + 4 : margin + (pageWidth - margin * 2) / 2 + 4;
        if (!isLeft && idx > 0) {
          // same line
        } else if (idx > 0 && isLeft) {
          metaY += 5;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(`${key}:`, xPos, metaY);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        const keyWidth = doc.getTextWidth(`${key}: `);
        doc.text(String(val), xPos + keyWidth, metaY);
      });

      currentY += metaBoxHeight + 5;
    }

    // --- 4. SUMMARY CARDS (IF APPLICABLE) ---
    if (summaryMetrics && summaryMetrics.length > 0) {
      const cardGap = 3;
      const totalCards = summaryMetrics.length;
      const cardWidth = (pageWidth - (margin * 2) - (cardGap * (totalCards - 1))) / totalCards;
      const cardHeight = 14;

      summaryMetrics.forEach((m, idx) => {
        const cardX = margin + idx * (cardWidth + cardGap);
        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(m.label || '', cardX + 3, currentY + 4.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 58, 138);
        doc.text(String(m.value || '-'), cardX + 3, currentY + 10.5);
      });

      currentY += cardHeight + 6;
    }

    // Helper Footer callback
    const drawFooter = (data) => {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(
        'Sadewa - Sistem Layanan Panggilan Pemasyarakatan | Dokumen Resmi Bersifat Rahasia',
        margin,
        pageHeight - 7
      );

      doc.setFont('helvetica', 'bold');
      doc.text(
        `Halaman ${data.pageNumber} / ${pageCount}`,
        pageWidth - margin,
        pageHeight - 7,
        { align: 'right' }
      );
    };

    // --- 5. DATA TABLES (autoTable multi-table or single table) ---
    if (hasTables) {
      tables.forEach((tbl) => {
        if (!tbl.rows || !tbl.rows.length) return;

        // Cek sisa tinggi halaman sebelum judul tabel
        if (currentY > pageHeight - 40) {
          doc.addPage();
          currentY = 16;
        }

        if (tbl.title) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(30, 58, 138); // Primary navy #1e3a8a
          doc.text(tbl.title.toUpperCase(), margin, currentY);
          currentY += 4;
        }

        if (tbl.subtitle) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(100, 116, 139);
          doc.text(tbl.subtitle, margin, currentY);
          currentY += 3.5;
        }

        autoTable(doc, {
          startY: currentY,
          head: [tbl.headers],
          body: tbl.rows,
          margin: { left: margin, right: margin, bottom: 18 },
          theme: 'grid',
          styles: {
            font: 'helvetica',
            fontSize: 7.2,
            textColor: [51, 65, 85],
            cellPadding: 2.2,
            overflow: 'linebreak',
            lineColor: [226, 232, 240],
            lineWidth: 0.2
          },
          headStyles: {
            fillColor: [30, 58, 138],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 7.8,
            halign: 'left',
            valign: 'middle'
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          },
          didDrawPage: drawFooter
        });

        currentY = doc.lastAutoTable.finalY + 8;
      });
    } else {
      autoTable(doc, {
        startY: currentY,
        head: [headers],
        body: rows,
        margin: { left: margin, right: margin, bottom: 18 },
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 7.5,
          textColor: [51, 65, 85], // slate-700
          cellPadding: 2.5,
          overflow: 'linebreak',
          lineColor: [226, 232, 240], // slate-200
          lineWidth: 0.2
        },
        headStyles: {
          fillColor: [30, 58, 138], // #1e3a8a
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'left',
          valign: 'middle'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // slate-50
        },
        didDrawPage: drawFooter
      });
    }

    const cleanBase = (filename || 'laporan_pascall.pdf')
      .replace(/[/\\?%*:|"<>]/g, '_')
      .replace(/\s+/g, '_')
      .trim();
    const finalName = cleanBase.toLowerCase().endsWith('.pdf') ? cleanBase : `${cleanBase}.pdf`;

    const blob = doc.output('blob');
    saveBlobAsFile(blob, finalName);
    return true;
  } catch (err) {
    console.error('[ExportUtils] Gagal mengekspor PDF:', err);
    alert('Terjadi kesalahan saat mengekspor ke format PDF.');
    return false;
  }
};

/**
 * Utility helper to safely trigger browser download from a Blob
 */
export const saveBlobAsFile = (blob, filename) => {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 2000);
    return true;
  } catch (err) {
    console.error('[ExportUtils] Error saving blob as file:', err);
    return false;
  }
};

/**
 * Utility to download call transcript in professional PDF format.
 */
export const downloadTranscriptPDF = ({
  transcriptText = '',
  transcriptData = null,
  callInfo = {},
  inmateInfo = {},
  uptName = 'UPT Pemasyarakatan',
  printedBy = 'Kepala UPT',
  filename = 'transkrip_panggilan.pdf'
}) => {
  if (!transcriptText && (!transcriptData || !transcriptData.length)) {
    alert('Belum ada teks transkrip untuk diunduh.');
    return false;
  }

  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    let currentY = 14;

    // Top Accent Bar
    doc.setFillColor(30, 58, 138); // #1e3a8a
    doc.rect(0, 0, pageWidth, 5, 'F');

    // Header Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 58, 138);
    doc.text('SADEWA - TRANSKRIP RESMI REKAMAN PANGGILAN', margin, currentY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Dokumen Rekaman Percakapan Warga Binaan Pemasyarakatan (WBP)', margin, currentY + 9);

    // Right Badge
    doc.setFillColor(254, 242, 242); // rose-50
    doc.setDrawColor(254, 202, 202); // rose-200
    doc.roundedRect(pageWidth - margin - 40, currentY, 40, 12, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(185, 28, 28); // rose-700
    doc.text('RAHASIA & TERBATAS', pageWidth - margin - 20, currentY + 5.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(153, 27, 27);
    doc.text('Pengawasan Resmi UPT', pageWidth - margin - 20, currentY + 9.5, { align: 'center' });

    currentY += 16;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(margin, currentY, pageWidth - margin, currentY);

    currentY += 5;

    // Call Information Card
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    const infoHeight = 26;
    doc.roundedRect(margin, currentY, pageWidth - (margin * 2), infoHeight, 2, 2, 'FD');

    const col1X = margin + 4;
    const col2X = margin + (pageWidth - margin * 2) / 2 + 4;

    const infoList = [
      { label: 'Nama WBP', val: inmateInfo.name || callInfo.inmateName || callInfo.from || 'Ahmad Fauzi', isLeft: true, row: 0 },
      { label: 'NIP / Reg WBP', val: inmateInfo.wbpRegNumber || inmateInfo.nip || callInfo.inmateId || 'NIP-7721', isLeft: true, row: 1 },
      { label: 'Nomor Tujuan', val: callInfo.targetNumber || callInfo.familyPhone || '-', isLeft: true, row: 2 },
      { label: 'Lokasi UPT', val: uptName || callInfo.branchName || 'Lapas Kelas 1', isLeft: false, row: 0 },
      { label: 'Waktu Panggilan', val: callInfo.date ? new Date(callInfo.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : (callInfo.timestamp || new Date().toLocaleString('id-ID')), isLeft: false, row: 1 },
      { label: 'Durasi / Status', val: `${callInfo.duration || (callInfo.durationSeconds ? `${Math.floor(callInfo.durationSeconds / 60)}m ${callInfo.durationSeconds % 60}s` : '05:20')} | ${callInfo.status || 'Berhasil'}`, isLeft: false, row: 2 },
    ];

    infoList.forEach(item => {
      const posX = item.isLeft ? col1X : col2X;
      const posY = currentY + 5.5 + (item.row * 6.5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`${item.label}:`, posX, posY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      const labelW = doc.getTextWidth(`${item.label}: `);
      doc.text(String(item.val), posX + labelW, posY);
    });

    currentY += infoHeight + 6;

    // Transcript Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 58, 138);
    doc.text('ISI PERCAKAPAN LENGKAP', margin, currentY);

    currentY += 4;

    // Parse transcript content
    let lines = [];
    if (transcriptData && Array.isArray(transcriptData)) {
      lines = transcriptData.map(item => ({
        time: item.time || item.timestamp || '',
        speaker: item.speaker || (item.role === 'inmate' ? 'WBP' : 'Lawan Bicara'),
        text: item.text || item.message || ''
      }));
    } else {
      // Parse plain text with timestamps / speaker prefixes
      const rawLines = transcriptText.split('\n').filter(l => l.trim() !== '');
      lines = rawLines.map(raw => {
        const matchWithSpeaker = raw.match(/^\[?([0-9]{2}:[0-9]{2}(?:\s*-\s*[0-9]{2}:[0-9]{2})?)?\]?\s*([A-Za-z0-9\s()_-]+)?:\s*(.*)$/);
        if (matchWithSpeaker) {
          return {
            time: matchWithSpeaker[1] || '',
            speaker: (matchWithSpeaker[2] || 'Pembicara').trim(),
            text: matchWithSpeaker[3] || ''
          };
        }

        const matchSegmentOnly = raw.match(/^\[([0-9]{2}:[0-9]{2}(?:\s*-\s*[0-9]{2}:[0-9]{2})?)\]\s*(.*)$/);
        if (matchSegmentOnly) {
          return {
            time: matchSegmentOnly[1] || '',
            speaker: 'Percakapan',
            text: matchSegmentOnly[2] || ''
          };
        }

        return {
          time: '',
          speaker: 'Percakapan',
          text: raw
        };
      });
    }

    // Render dialogue rows using autoTable for perfect auto-paging and wrapping
    const dialogueRows = lines.map(line => [
      line.time || '-',
      line.speaker,
      line.text
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Waktu', 'Pembicara', 'Transkrip Dialog']],
      body: dialogueRows,
      margin: { left: margin, right: margin, bottom: 18 },
      theme: 'grid',
      columnStyles: {
        0: { cellWidth: 26, halign: 'center', fontStyle: 'bold', textColor: [100, 116, 139] },
        1: { cellWidth: 38, fontStyle: 'bold', textColor: [30, 58, 138] },
        2: { cellWidth: 'auto', textColor: [15, 23, 42] }
      },
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
        lineColor: [226, 232, 240],
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      didDrawPage: (data) => {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Sadewa Monitor Layanan - Dicetak oleh: ${printedBy} | ${new Date().toLocaleDateString('id-ID')}`,
          margin,
          pageHeight - 7
        );

        doc.setFont('helvetica', 'bold');
        doc.text(
          `Halaman ${data.pageNumber} / ${pageCount}`,
          pageWidth - margin,
          pageHeight - 7,
          { align: 'right' }
        );
      }
    });

    const cleanBase = (filename || 'transkrip_panggilan.pdf')
      .replace(/[/\\?%*:|"<>]/g, '_')
      .replace(/\s+/g, '_')
      .trim();
    const finalName = cleanBase.toLowerCase().endsWith('.pdf') ? cleanBase : `${cleanBase}.pdf`;

    const blob = doc.output('blob');
    saveBlobAsFile(blob, finalName);
    return true;
  } catch (err) {
    console.error('[ExportUtils] Gagal membuat PDF transkrip:', err);
    alert('Terjadi kesalahan saat mengunduh transkrip PDF.');
    return false;
  }
};

/**
 * Utility to download text content (fallback plain text).
 */
export const downloadTextFile = (content, filename = 'transkrip_percakapan.txt') => {
  if (!content) {
    alert('Belum ada teks transkrip untuk diunduh.');
    return false;
  }

  try {
    const finalName = filename.toLowerCase().endsWith('.txt') ? filename : `${filename}.txt`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('[ExportUtils] Gagal mengunduh berkas transkrip .txt:', err);
    return false;
  }
};

/**
 * Utility to download audio recordings as .mp3 files.
 */
export const downloadAudioFile = async (audioUrl, filename = 'rekaman_panggilan.mp3') => {
  if (!audioUrl) {
    alert('Berkas rekaman audio belum tersedia untuk diunduh.');
    return false;
  }

  try {
    const finalName = filename.toLowerCase().endsWith('.mp3') ? filename : `${filename}.mp3`;
    
    // Fetch blob if possible to force download with proper filename
    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = finalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    } catch {
      // Fallback direct link
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = finalName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }
  } catch (err) {
    console.error('[ExportUtils] Gagal mengunduh berkas rekaman audio:', err);
    return false;
  }
};

/**
 * Legacy CSV export fallback
 */
export const exportToCSV = (data, filename = 'export_sadewa.csv') => {
  if (!data || !data.length) {
    alert('Tidak ada data untuk diexport.');
    return false;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [];
  csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

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
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
};


/**
 * Utility to export a Clean, Simple Invoice PDF (Faktur Tagihan Layanan Komunikasi)
 * Focus:
 * 1. Total Omset Pemasukan (100%)
 * 2. Hak Internal Lapas / UPT (40%)
 * 3. Total Kewajiban Setoran ke Rekening Vendor (60%)
 */
export const exportInvoicePDF = ({
  invoiceNumber = 'INV-TAGIHAN',
  period = 'November 2026',
  branchName = 'Cabang Lapas',
  canteenName = 'Koperasi Lapas',
  totalGross = 0,
  canteenKeepAmount = 0,
  vendorDepositAmount = 0,
  vendorPercent = 60,
  canteenPercent = 40,
  totalMinutes = 0,
  totalSeconds = 0,
  ratePerSecond = 15,
  status = 'BELUM DIBAYAR',
  dueDate = null,
  bankInfo = null,
  filename,
}) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    let currentY = 14;

    // 1. Accent Bar
    doc.setFillColor(30, 58, 138); // Primary Navy #1e3a8a
    doc.rect(0, 0, pageWidth, 5, 'F');

    // 2. KOP INVOICE
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30, 58, 138);
    doc.text('SADEWA INDONESIA', margin, currentY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('FAKTUR TAGIHAN BULANAN LAYANAN KOMUNIKASI', margin, currentY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Sistem Pemantauan & Penagihan Pascabayar Layanan Komunikasi Pemasyarakatan', margin, currentY + 17);

    // Right Badge
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(pageWidth - margin - 48, currentY, 48, 16, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('FAKTUR RESMI', pageWidth - margin - 24, currentY + 6, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const isPaid = String(status).toUpperCase() === 'PAID' || String(status).toUpperCase() === 'LUNAS';
    doc.setTextColor(isPaid ? 22 : 194, isPaid ? 101 : 65, isPaid ? 52 : 12);
    doc.text(isPaid ? 'LUNAS (PAID)' : 'MENUNGGU SETORAN', pageWidth - margin - 24, currentY + 12, { align: 'center' });

    currentY += 23;

    // Divider Line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 6;

    // 3. Grid Metadata Tagihan (2 Kolom)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text('INFORMASI TAGIHAN', margin, currentY);
    doc.text('DITAGIHKAN KEPADA', pageWidth / 2 + 5, currentY);
    currentY += 4;

    const infoBoxY = currentY;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, infoBoxY, (pageWidth - margin * 2) / 2 - 4, 28, 2, 2, 'F');
    doc.roundedRect(pageWidth / 2 + 2, infoBoxY, (pageWidth - margin * 2) / 2 - 2, 28, 2, 2, 'F');

    // Kolom Kiri
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Nomor Invoice:', margin + 4, infoBoxY + 6);
    doc.text('Periode Layanan:', margin + 4, infoBoxY + 12);
    doc.text('Tarif Komunikasi:', margin + 4, infoBoxY + 18);
    doc.text('Total Pemakaian:', margin + 4, infoBoxY + 24);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(String(invoiceNumber || '-'), margin + 34, infoBoxY + 6);
    doc.text(String(period || '-'), margin + 34, infoBoxY + 12);
    doc.text(`Rp ${Number(ratePerSecond || 15).toLocaleString('id-ID')} / detik`, margin + 34, infoBoxY + 18);
    doc.text(`${Number(totalSeconds || 0).toLocaleString('id-ID')} Detik (${Math.round((totalSeconds || 0) / 60)} Menit)`, margin + 34, infoBoxY + 24);

    // Kolom Kanan
    const rightColX = pageWidth / 2 + 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Unit Pelaksana Teknis:', rightColX, infoBoxY + 6);
    doc.text('Pengelola Kantin:', rightColX, infoBoxY + 12);
    doc.text('Jatuh Tempo:', rightColX, infoBoxY + 18);
    doc.text('Status Pembayaran:', rightColX, infoBoxY + 24);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(String(branchName || 'Lapas / Rutan'), rightColX + 34, infoBoxY + 6);
    doc.text(String(canteenName || 'Koperasi Lapas'), rightColX + 34, infoBoxY + 12);
    doc.text(String(dueDate || 'Tanggal 2 bulan berikutnya'), rightColX + 34, infoBoxY + 18);
    doc.setTextColor(isPaid ? 22 : 180, isPaid ? 101 : 83, isPaid ? 52 : 9);
    doc.text(String(status || 'BELUM DIBAYAR'), rightColX + 34, infoBoxY + 24);

    currentY = infoBoxY + 34;

    // 4. Tabel Sederhana (3 Baris: Omset 100%, Hak UPT 40%, Setoran Vendor 60%)
    const tableRows = [
      [
        '1',
        'Total Omset Pemasukan Layanan Komunikasi WBP\n(Akumulasi detik pemakaian voucher x tarif per detik)',
        '100%',
        `Rp ${Number(totalGross || 0).toLocaleString('id-ID')}`
      ],
      [
        '2',
        'Hak Kelola Finansial Internal Lapas / UPT\n(Dikelola mandiri di kasir lokal: Koperasi 30%, Inkopasindo 10%)',
        `${canteenPercent}%`,
        `Rp ${Number(canteenKeepAmount || 0).toLocaleString('id-ID')}`
      ],
      [
        '3',
        'Total Kewajiban Setoran ke Rekening Vendor Sadewa\n(Wajib disetorkan oleh UPT/Kantin ke Rekening Penampung Vendor)',
        `${vendorPercent}%`,
        `Rp ${Number(vendorDepositAmount || 0).toLocaleString('id-ID')}`
      ]
    ];

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['NO', 'DESKRIPSI KOMPONEN PEMBAGIAN HASIL', 'PORSI', 'JUMLAH (RP)']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'left',
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
        3: { cellWidth: 38, halign: 'right', fontStyle: 'bold' },
      },
      styles: {
        fontSize: 8,
        textColor: [15, 23, 42],
        cellPadding: 3.5,
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      didParseCell: (data) => {
        // Highlight row 3 (Setoran Vendor 60%)
        if (data.row.index === 2 && data.section === 'body') {
          data.cell.styles.fillColor = [239, 246, 255]; // blue-50
          if (data.column.index === 3) {
            data.cell.styles.textColor = [29, 78, 216]; // blue-700
            data.cell.styles.fontSize = 9.5;
          }
        }
      }
    });

    currentY = doc.lastAutoTable.finalY + 5;

    // 5. Total Highlight Banner
    doc.setFillColor(30, 58, 138);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 14, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`TOTAL KEWAJIBAN SETORAN KE VENDOR (${vendorPercent}%):`, margin + 6, currentY + 8.5);

    doc.setFontSize(12);
    doc.text(`Rp ${Number(vendorDepositAmount || 0).toLocaleString('id-ID')}`, pageWidth - margin - 6, currentY + 9, { align: 'right' });

    currentY += 19;

    // 6. Petunjuk Pembayaran / Rekening Vendor
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 58, 138);
    doc.text('PETUNJUK PEMBAYARAN REKENING PENAMPUNG VENDOR SADEWA', margin + 4, currentY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const bankName = bankInfo?.bankName || 'Bank Mandiri';
    const accNo = bankInfo?.accountNumber || '123-00-9876543-1';
    const accHolder = bankInfo?.accountHolder || 'PT Sadewa Digital Nusantara';

    doc.text(`Bank Tujuan: ${bankName}`, margin + 4, currentY + 11);
    doc.text(`Nomor Rekening: ${accNo}`, margin + 4, currentY + 16);
    doc.text(`Atas Nama: ${accHolder}`, pageWidth / 2, currentY + 11);
    doc.text('Catatan: Cantumkan Nomor Invoice pada berita transfer.', pageWidth / 2, currentY + 16);

    currentY += 30;

    // 7. Kolom Pengesahan Tanda Tangan
    const colWidth = (pageWidth - margin * 2) / 2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);

    doc.text('Dikeluarkan Oleh (Vendor Sadewa):', margin + 10, currentY);
    doc.text('Mengetahui / Penanggung Jawab Lapas:', margin + colWidth + 10, currentY);

    currentY += 18;
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);
    doc.line(margin + 10, currentY, margin + colWidth - 20, currentY);
    doc.line(margin + colWidth + 10, currentY, pageWidth - margin - 20, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('Finance Sadewa Indonesia', margin + 10, currentY + 4);
    doc.text(`${branchName} / Inkopasindo`, margin + colWidth + 10, currentY + 4);

    // Save File
    const cleanFilename = filename || `Invoice_${invoiceNumber || 'Sadewa'}.pdf`;
    doc.save(cleanFilename);
    return true;
  } catch (err) {
    console.error('[ExportInvoicePDF] Gagal membuat invoice PDF:', err);
    alert('Terjadi kesalahan saat membuat Invoice PDF.');
    return false;
  }
};

export default {
  exportToExcel,
  exportToPDF,
  exportInvoicePDF,
  downloadTranscriptPDF,
  downloadTextFile,
  downloadAudioFile,
  exportToCSV,
};
