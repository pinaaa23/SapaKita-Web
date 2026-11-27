export const mockDashboardStats = {
  totalCalls: 30, // Sesuai mockCalls.length
  totalRevenue: 3125000, // Sesuai total mockTransactions
  activeBranches: 8,
  successRate: 96.5,
  dropRate: 2.1,
  revenueTrend: [
    { date: '2026-09-16', revenue: 450000 },
    { date: '2026-09-17', revenue: 520000 },
    { date: '2026-09-18', revenue: 480000 },
    { date: '2026-09-19', revenue: 610000 },
    { date: '2026-09-20', revenue: 590000 },
    { date: '2026-09-21', revenue: 410000 },
    { date: '2026-09-22', revenue: 440000 },
  ],
  callTrend: [
    { date: '2026-09-16', calls: 5 },
    { date: '2026-09-17', calls: 6 },
    { date: '2026-09-18', calls: 4 },
    { date: '2026-09-19', calls: 5 },
    { date: '2026-09-20', calls: 3 },
    { date: '2026-09-21', calls: 4 },
    { date: '2026-09-22', calls: 3 },
  ],
};

export const mockBranches = [
  { 
    id: 'b1', 
    name: 'Lapas Kelas I Cipinang', 
    location: 'Jakarta Timur', 
    address: 'Jl. Raya Bekasi Timur No.170, Cipinang, Jakarta Timur',
    phone: '021-8190001',
    capacity: 2500,
    inmateCount: 3100,
    adminCount: 5, 
    status: 'Active' 
  },
  { 
    id: 'b2', 
    name: 'Lapas Pemuda Kelas IIA Tangerang', 
    location: 'Tangerang', 
    address: 'Jl. Pemuda No.1, Buaran Indah, Kec. Tangerang, Kota Tangerang',
    phone: '021-5523423',
    capacity: 1200,
    inmateCount: 2800,
    adminCount: 3, 
    status: 'Active' 
  },
  { 
    id: 'b3', 
    name: 'Lapas Narkotika Kelas IIA Jakarta', 
    location: 'Jakarta Timur', 
    address: 'Jl. Lembaga Pemasyarakatan, Cipinang, Jakarta Timur',
    phone: '021-85913210',
    capacity: 1000,
    inmateCount: 2100,
    adminCount: 4, 
    status: 'Active' 
  },
  { 
    id: 'b4', 
    name: 'Lapas Kelas I Sukamiskin', 
    location: 'Bandung', 
    address: 'Jl. A.H. Nasution No.114, Sukamiskin, Kec. Arcamanik, Kota Bandung',
    phone: '022-7206122',
    capacity: 550,
    inmateCount: 430,
    adminCount: 2, 
    status: 'Active' 
  },
  { 
    id: 'b5', 
    name: 'Lapas Perempuan Kelas IIA Malang', 
    location: 'Malang', 
    address: 'Jl. S. Supriadi No.38, Sukun, Kec. Sukun, Kota Malang',
    phone: '0341-362243',
    capacity: 400,
    inmateCount: 520,
    adminCount: 3, 
    status: 'Active' 
  },
  { 
    id: 'b6', 
    name: 'Rutan Kelas I Medaeng', 
    location: 'Sidoarjo', 
    address: 'Jl. Letjen Sutoyo No.24, Medaeng, Kec. Waru, Kabupaten Sidoarjo',
    phone: '031-8531122',
    capacity: 750,
    inmateCount: 1800,
    adminCount: 4, 
    status: 'Active' 
  },
  { 
    id: 'b7', 
    name: 'Lapas Kelas IIA Kerobokan', 
    location: 'Badung', 
    address: 'Jl. Tangkuban Perahu, Kerobokan Kelod, Kuta Utara, Kab. Badung',
    phone: '0361-411306',
    capacity: 320,
    inmateCount: 1350,
    adminCount: 5, 
    status: 'Active' 
  },
  { 
    id: 'b8', 
    name: 'Lapas Kelas I Lowokwaru', 
    location: 'Malang', 
    address: 'Jl. Asahan No.7, Bunulrejo, Kec. Blimbing, Kota Malang',
    phone: '0341-491136',
    capacity: 1200,
    inmateCount: 2400,
    adminCount: 6, 
    status: 'Active' 
  },
  { 
    id: 'b9', 
    name: 'Lapas Kelas IIA Ambarawa', 
    location: 'Semarang', 
    address: 'Jl. Jend. Sudirman, Ambarawa, Kabupaten Semarang',
    phone: '0298-591030',
    capacity: 500,
    inmateCount: 480,
    adminCount: 2, 
    status: 'Inactive' 
  }
];

export const mockUsers = [
  { id: 'u1', name: 'Budi Santoso', email: 'budi.s@sapakita.id', phone: '081234567890', role: 'Admin Cabang', branchId: 'b1', status: 'Active', joinDate: '2025-01-15' },
  { id: 'u2', name: 'Siti Aminah', email: 'siti.a@sapakita.id', phone: '082134567891', role: 'Admin Cabang', branchId: 'b1', status: 'Active', joinDate: '2025-02-10' },
  { id: 'u3', name: 'Agus Pratama', email: 'agus.p@sapakita.id', phone: '081334567892', role: 'Admin Cabang', branchId: 'b2', status: 'Active', joinDate: '2025-03-22' },
  { id: 'u4', name: 'Dewi Lestari', email: 'dewi.l@sapakita.id', phone: '081534567893', role: 'Admin Cabang', branchId: 'b3', status: 'Suspended', joinDate: '2025-04-05' },
  { id: 'u5', name: 'Hendra Wijaya', email: 'hendra.w@sapakita.id', phone: '085734567894', role: 'Admin Cabang', branchId: 'b5', status: 'Active', joinDate: '2025-05-18' },
  { id: 'u6', name: 'Putu Gede', email: 'putu.g@sapakita.id', phone: '081834567895', role: 'Admin Cabang', branchId: 'b7', status: 'Active', joinDate: '2025-06-30' },
  { id: 'u7', name: 'Arief Rahman', email: 'arief.r@sapakita.id', phone: '082234567896', role: 'Admin Cabang', branchId: 'b1', status: 'Active', joinDate: '2025-07-12' },
  { id: 'u8', name: 'Lia Kusuma', email: 'lia.k@sapakita.id', phone: '081934567897', role: 'Admin Cabang', branchId: 'b3', status: 'Active', joinDate: '2025-08-25' },
  { id: 'u9', name: 'Doni Saputra', email: 'doni.s@sapakita.id', phone: '085234567898', role: 'Admin Cabang', branchId: 'b4', status: 'Active', joinDate: '2025-09-08' },
  { id: 'u10', name: 'Ratna Sari', email: 'ratna.s@sapakita.id', phone: '081134567899', role: 'Admin Cabang', branchId: 'b6', status: 'Suspended', joinDate: '2025-10-21' },
  { id: 'u11', name: 'Yudi Hermawan', email: 'yudi.h@sapakita.id', phone: '082334567800', role: 'Admin Cabang', branchId: 'b8', status: 'Active', joinDate: '2025-11-03' },
  { id: 'u12', name: 'Nurul Hidayah', email: 'nurul.h@sapakita.id', phone: '081734567801', role: 'Admin Cabang', branchId: 'b2', status: 'Active', joinDate: '2025-12-16' },
  { id: 'u13', name: 'Fajar Nugroho', email: 'fajar.n@sapakita.id', phone: '085634567802', role: 'Admin Cabang', branchId: 'b5', status: 'Active', joinDate: '2026-01-28' },
  { id: 'u14', name: 'Tuti Suhartini', email: 'tuti.s@sapakita.id', phone: '081434567803', role: 'Admin Cabang', branchId: 'b4', status: 'Active', joinDate: '2026-02-14' },
  { id: 'u15', name: 'Rahmat Hidayat', email: 'rahmat.h@sapakita.id', phone: '082134567804', role: 'Admin Cabang', branchId: 'b1', status: 'Suspended', joinDate: '2026-03-09' },
  { id: 'u16', name: 'Eka Putra', email: 'eka.p@sapakita.id', phone: '081234567805', role: 'Admin Cabang', branchId: 'b6', status: 'Active', joinDate: '2026-04-22' },
  { id: 'u17', name: 'Sinta Dewi', email: 'sinta.d@sapakita.id', phone: '085834567806', role: 'Admin Cabang', branchId: 'b2', status: 'Active', joinDate: '2026-05-11' },
  { id: 'u18', name: 'Bambang Pamungkas', email: 'bambang.p@sapakita.id', phone: '081934567807', role: 'Admin Cabang', branchId: 'b8', status: 'Active', joinDate: '2026-06-05' },
  { id: 'u19', name: 'Wulan Guritno', email: 'wulan.g@sapakita.id', phone: '082234567808', role: 'Admin Cabang', branchId: 'b7', status: 'Active', joinDate: '2026-07-19' },
  { id: 'u20', name: 'Joko Anwar', email: 'joko.a@sapakita.id', phone: '081134567809', role: 'Admin Cabang', branchId: 'b3', status: 'Suspended', joinDate: '2026-08-30' },
  { id: 'u21', name: 'Ika Pertiwi', email: 'ika.p@sapakita.id', phone: '085234567810', role: 'Admin Cabang', branchId: 'b1', status: 'Active', joinDate: '2026-09-12' },
];

export const mockCalls = [
  { id: 'c1', branchId: 'b1', inmateId: 'REG-CPN-2026-001', inmateName: 'Ahmad bin Jono', familyName: 'Suryani (Istri)', familyPhone: '08123456001', durationSeconds: 600, cost: 15000, status: 'Answered', date: '2026-09-22T10:00:00Z', hasRecording: true, transcriptStatus: 'Completed', callType: 'Voice', accessLogs: [{ name: 'Budi Santoso', time: '2026-09-22T10:30:00Z' }] },
  { id: 'c2', branchId: 'b2', inmateId: 'REG-CPN-2026-002', inmateName: 'Bagus S.', familyName: 'Rini (Ibu)', familyPhone: '08123456002', durationSeconds: 300, cost: 7500, status: 'Answered', date: '2026-09-22T10:15:00Z', hasRecording: true, transcriptStatus: 'Completed', callType: 'Voice', accessLogs: [] },
  { id: 'c3', branchId: 'b1', inmateId: 'REG-CPN-2026-003', inmateName: 'Candra W.', familyName: 'Dinda (Adik)', familyPhone: '08123456003', durationSeconds: 0, cost: 0, status: 'Busy', date: '2026-09-22T10:30:00Z', hasRecording: false, transcriptStatus: null, callType: 'Voice', accessLogs: [] },
  { id: 'c4', branchId: 'b5', inmateId: 'REG-CPN-2026-004', inmateName: 'Dian M.', familyName: 'Tono (Suami)', familyPhone: '08123456004', durationSeconds: 900, cost: 22500, status: 'Answered', date: '2026-09-22T11:00:00Z', hasRecording: true, transcriptStatus: 'Processing', callType: 'Voice', accessLogs: [] },
  { id: 'c5', branchId: 'b3', inmateId: 'REG-CPN-2026-005', inmateName: 'Eko Prasetyo', familyName: 'Susi (Istri)', familyPhone: '08123456005', durationSeconds: 1200, cost: 30000, status: 'Answered', date: '2026-09-21T09:00:00Z', hasRecording: true, transcriptStatus: 'Completed', callType: 'Voice', accessLogs: [{ name: 'Lia Kusuma', time: '2026-09-21T10:00:00Z' }] },
  { id: 'c6', branchId: 'b7', inmateId: 'REG-CPN-2026-006', inmateName: 'Ferry H.', familyName: 'Sari (Ibu)', familyPhone: '08123456006', durationSeconds: 0, cost: 0, status: 'No Answer', date: '2026-09-21T09:30:00Z', hasRecording: false, transcriptStatus: null, callType: 'Voice', accessLogs: [] },
  { id: 'c7', branchId: 'b8', inmateId: 'REG-CPN-2026-007', inmateName: 'Gilang Ramadhan', familyName: 'Maya (Kakak)', familyPhone: '08123456007', durationSeconds: 450, cost: 11250, status: 'Answered', date: '2026-09-21T10:00:00Z', hasRecording: true, transcriptStatus: 'Completed', callType: 'Voice', accessLogs: [] },
  { id: 'c8', branchId: 'b4', inmateId: 'REG-CPN-2026-008', inmateName: 'Hendra Setiawan', familyName: 'Putri (Istri)', familyPhone: '08123456008', durationSeconds: 600, cost: 15000, status: 'Answered', date: '2026-09-21T11:30:00Z', hasRecording: true, transcriptStatus: 'Completed', callType: 'Voice', accessLogs: [] },
  { id: 'c9', branchId: 'b6', inmateId: 'REG-CPN-2026-009', inmateName: 'Iwan Fals', familyName: 'Rossa (Anak)', familyPhone: '08123456009', durationSeconds: 0, cost: 0, status: 'Busy', date: '2026-09-21T13:00:00Z', hasRecording: false, transcriptStatus: null, callType: 'Voice', accessLogs: [] },
  { id: 'c10', branchId: 'b2', inmateId: 'REG-CPN-2026-010', inmateName: 'Joni Iskandar', familyName: 'Rita (Istri)', familyPhone: '08123456010', durationSeconds: 900, cost: 22500, status: 'Answered', date: '2026-09-20T08:00:00Z', hasRecording: true, transcriptStatus: 'Completed', callType: 'Voice', accessLogs: [{ name: 'Agus Pratama', time: '2026-09-20T09:00:00Z' }] },
  { id: 'c11', branchId: 'b1', inmateId: 'REG-CPN-2026-011', inmateName: 'Kiki Fatmala', familyName: 'Rudi (Suami)', familyPhone: '08123456011', durationSeconds: 1500, cost: 37500, status: 'Answered', date: '2026-09-20T09:15:00Z', hasRecording: true, transcriptStatus: 'Completed', callType: 'Voice', accessLogs: [] },
  { id: 'c12', branchId: 'b5', inmateId: 'REG-CPN-2026-012', inmateName: 'Lukman Hakim', familyName: 'Siti (Ibu)', familyPhone: '08123456012', durationSeconds: 0, cost: 0, status: 'No Answer', date: '2026-09-20T10:45:00Z', hasRecording: false, transcriptStatus: null, callType: 'Voice', accessLogs: [] },
  { id: 'c13', branchId: 'b8', inmateId: 'REG-CPN-2026-013', inmateName: 'Maulana', familyName: 'Dina (Istri)', familyPhone: '08123456013', durationSeconds: 300, cost: 7500, status: 'Answered', date: '2026-09-20T14:00:00Z', hasRecording: true, transcriptStatus: 'Processing', callType: 'Voice', accessLogs: [] },
  { id: 'c14', branchId: 'b3', inmateId: 'REG-CPN-2026-014', inmateName: 'Novan', familyName: 'Rian (Adik)', familyPhone: '08123456014', durationSeconds: 600, cost: 15000, status: 'Answered', date: '2026-09-19T08:30:00Z', hasRecording: true, transcriptStatus: 'Completed', callType: 'Voice', accessLogs: [] },
  { id: 'c15', branchId: 'b7', inmateId: 'REG-CPN-2026-015', inmateName: 'Oki Setiana', familyName: 'Arief (Suami)', familyPhone: '08123456015', durationSeconds: 1200, cost: 30000, status: 'Answered', date: '2026-09-19T10:00:00Z', hasRecording: true, transcriptStatus: 'Completed', callType: 'Voice', accessLogs: [{ name: 'Putu Gede', time: '2026-09-19T11:00:00Z' }] },
  { id: 'c16', branchId: 'b1', inmateId: 'REG-CPN-2026-016', inmateName: 'Parto', familyName: 'Sule (Teman)', familyPhone: '08123456016', durationSeconds: 0, cost: 0, status: 'Busy', date: '2026-09-19T11:15:00Z', hasRecording: false, transcriptStatus: null, callType: 'Voice', accessLogs: [] },
  { id: 'c17', branchId: 'b4', inmateId: 'REG-CPN-2026-017', inmateName: 'Qomar', familyName: 'Nini (Ibu)', familyPhone: '08123456017', durationSeconds: 450, cost: 11250, status: 'Answered', date: '2026-09-19T13:45:00Z', hasRecording: true, transcriptStatus: 'Completed', callType: 'Voice', accessLogs: [] },
  { id: 'c18', branchId: 'b2', inmateId: 'REG-CPN-2026-018', inmateName: 'Raffi Ahmad', familyName: 'Nagita (Istri)', familyPhone: '08123456018', durationSeconds: 900, cost: 22500, status: 'Answered', date: '2026-09-18T09:00:00Z', hasRecording: true, transcriptStatus: 'Completed', callType: 'Voice', accessLogs: [] },
  { id: 'c19', branchId: 'b6', inmateId: 'REG-CPN-2026-019', inmateName: 'Sule', familyName: 'Andre (Teman)', familyPhone: '08123456019', durationSeconds: 0, cost: 0, status: 'No Answer', date: '2026-09-18T10:30:00Z', hasRecording: false, transcriptStatus: null, callType: 'Voice', accessLogs: [] },
  { id: 'c20', branchId: 'b5', inmateId: 'REG-CPN-2026-020', inmateName: 'Tukul Arwana', familyName: 'Susi (Istri)', familyPhone: '08123456020', durationSeconds: 600, cost: 15000, status: 'Answered', date: '2026-09-18T14:15:00Z', hasRecording: true, transcriptStatus: 'Completed', callType: 'Voice', accessLogs: [{ name: 'Hendra Wijaya', time: '2026-09-18T15:00:00Z' }] },
  { id: 'c21', branchId: 'b1', inmateId: 'REG-CPN-2026-021', inmateName: 'Uya Kuya', familyName: 'Astrid (Istri)', familyPhone: '08123456021', durationSeconds: 1200, cost: 30000, status: 'Answered', date: '2026-09-17T08:45:00Z', hasRecording: true, transcriptStatus: 'Completed', callType: 'Voice', accessLogs: [] },
  { id: 'c22', branchId: 'b8', inmateId: 'REG-CPN-2026-022', inmateName: 'Vicky Prasetyo', familyName: 'Angel (Mantan)', familyPhone: '08123456022', durationSeconds: 0, cost: 0, status: 'Busy', date: '2026-09-17T11:00:00Z', hasRecording: false, transcriptStatus: null, callType: 'Voice', accessLogs: [] },
  { id: 'c23', branchId: 'b3', inmateId: 'REG-CPN-2026-023', inmateName: 'Wendi Cagur', familyName: 'Ayu (Istri)', familyPhone: '08123456023', durationSeconds: 300, cost: 7500, status: 'Answered', date: '2026-09-17T13:30:00Z', hasRecording: true, transcriptStatus: 'Processing', callType: 'Voice', accessLogs: [] },
  { id: 'c24', branchId: 'b7', inmateId: 'REG-CPN-2026-024', inmateName: 'Xabiru', familyName: 'Rachel (Ibu)', familyPhone: '08123456024', durationSeconds: 900, cost: 22500, status: 'Answered', date: '2026-09-16T09:15:00Z', hasRecording: true, transcriptStatus: 'Completed', callType: 'Voice', accessLogs: [] },
  { id: 'c25', branchId: 'b2', inmateId: 'REG-CPN-2026-025', inmateName: 'Yanto', familyName: 'Sri (Istri)', familyPhone: '08123456025', durationSeconds: 0, cost: 0, status: 'No Answer', date: '2026-09-16T10:45:00Z', hasRecording: false, transcriptStatus: null, callType: 'Voice', accessLogs: [] },
  { id: 'c26', branchId: 'b4', inmateId: 'REG-CPN-2026-026', inmateName: 'Zainal', familyName: 'Nur (Ibu)', familyPhone: '08123456026', durationSeconds: 600, cost: 15000, status: 'Answered', date: '2026-09-16T14:00:00Z', hasRecording: true, transcriptStatus: 'Completed', callType: 'Voice', accessLogs: [{ name: 'Tuti Suhartini', time: '2026-09-16T15:00:00Z' }] },
  { id: 'c27', branchId: 'b1', inmateId: 'REG-CPN-2026-027', inmateName: 'Andi Mallarangeng', familyName: 'Choel (Adik)', familyPhone: '08123456027', durationSeconds: 1500, cost: 37500, status: 'Answered', date: '2026-09-15T08:30:00Z', hasRecording: true, transcriptStatus: 'Completed', callType: 'Voice', accessLogs: [] },
  { id: 'c28', branchId: 'b6', inmateId: 'REG-CPN-2026-028', inmateName: 'Anas Urbaningrum', familyName: 'Athiyyah (Istri)', familyPhone: '08123456028', durationSeconds: 0, cost: 0, status: 'Busy', date: '2026-09-15T11:15:00Z', hasRecording: false, transcriptStatus: null, callType: 'Voice', accessLogs: [] },
  { id: 'c29', branchId: 'b5', inmateId: 'REG-CPN-2026-029', inmateName: 'Setya Novanto', familyName: 'Deisti (Istri)', familyPhone: '08123456029', durationSeconds: 900, cost: 22500, status: 'Answered', date: '2026-09-15T13:45:00Z', hasRecording: true, transcriptStatus: 'Processing', callType: 'Voice', accessLogs: [] },
  { id: 'c30', branchId: 'b8', inmateId: 'REG-CPN-2026-030', inmateName: 'Nazaruddin', familyName: 'Neneng (Istri)', familyPhone: '08123456030', durationSeconds: 600, cost: 15000, status: 'Answered', date: '2026-09-14T09:00:00Z', hasRecording: true, transcriptStatus: 'Completed', callType: 'Voice', accessLogs: [] }
];

export const mockVideoCalls = [
  { id: 'vc1', branchId: 'b1', inmateId: 'REG-CPN-2026-001', inmateName: 'Ahmad bin Jono', familyName: 'Suryani (Istri)', familyPhone: '08123456001', durationSeconds: 720, cost: 25000, status: 'Answered', date: '2026-09-22T14:30:00Z', hasRecording: true, transcriptStatus: 'Completed', callType: 'Video', accessLogs: [{ name: 'Budi Santoso', time: '2026-09-22T15:00:00Z' }] },
  { id: 'vc2', branchId: 'b1', inmateId: 'REG-CPN-2026-003', inmateName: 'Candra W.', familyName: 'Dinda (Adik)', familyPhone: '08123456003', durationSeconds: 0, cost: 0, status: 'No Answer', date: '2026-09-22T13:15:00Z', hasRecording: false, transcriptStatus: null, callType: 'Video', accessLogs: [] },
  { id: 'vc3', branchId: 'b1', inmateId: 'REG-CPN-2026-011', inmateName: 'Kiki Fatmala', familyName: 'Rudi (Suami)', familyPhone: '08123456011', durationSeconds: 900, cost: 30000, status: 'Answered', date: '2026-09-21T15:00:00Z', hasRecording: true, transcriptStatus: 'Completed', callType: 'Video', accessLogs: [] },
  { id: 'vc4', branchId: 'b1', inmateId: 'REG-CPN-2026-016', inmateName: 'Parto', familyName: 'Sule (Teman)', familyPhone: '08123456016', durationSeconds: 480, cost: 17500, status: 'Answered', date: '2026-09-21T11:45:00Z', hasRecording: true, transcriptStatus: 'Completed', callType: 'Video', accessLogs: [] },
  { id: 'vc5', branchId: 'b1', inmateId: 'REG-CPN-2026-021', inmateName: 'Uya Kuya', familyName: 'Astrid (Istri)', familyPhone: '08123456021', durationSeconds: 1200, cost: 40000, status: 'Answered', date: '2026-09-20T16:20:00Z', hasRecording: true, transcriptStatus: 'Completed', callType: 'Video', accessLogs: [{ name: 'Siti Aminah', time: '2026-09-20T17:00:00Z' }] },
  { id: 'vc6', branchId: 'b1', inmateId: 'REG-CPN-2026-027', inmateName: 'Andi Mallarangeng', familyName: 'Choel (Adik)', familyPhone: '08123456027', durationSeconds: 0, cost: 0, status: 'Busy', date: '2026-09-20T10:10:00Z', hasRecording: false, transcriptStatus: null, callType: 'Video', accessLogs: [] },
  { id: 'vc7', branchId: 'b2', inmateId: 'REG-CPN-2026-002', inmateName: 'Bagus S.', familyName: 'Rini (Ibu)', familyPhone: '08123456002', durationSeconds: 600, cost: 20000, status: 'Answered', date: '2026-09-22T11:30:00Z', hasRecording: true, transcriptStatus: 'Completed', callType: 'Video', accessLogs: [] },
  { id: 'vc8', branchId: 'b3', inmateId: 'REG-CPN-2026-005', inmateName: 'Eko Prasetyo', familyName: 'Susi (Istri)', familyPhone: '08123456005', durationSeconds: 1050, cost: 35000, status: 'Answered', date: '2026-09-21T14:10:00Z', hasRecording: true, transcriptStatus: 'Completed', callType: 'Video', accessLogs: [] },
  { id: 'vc9', branchId: 'b1', inmateId: 'REG-CPN-2026-001', inmateName: 'Ahmad bin Jono', familyName: 'Suryani (Istri)', familyPhone: '08123456001', durationSeconds: 450, cost: 15000, status: 'Answered', date: '2026-09-19T09:30:00Z', hasRecording: true, transcriptStatus: 'Completed', callType: 'Video', accessLogs: [] },
  { id: 'vc10', branchId: 'b1', inmateId: 'REG-CPN-2026-011', inmateName: 'Kiki Fatmala', familyName: 'Rudi (Suami)', familyPhone: '08123456011', durationSeconds: 600, cost: 20000, status: 'Answered', date: '2026-09-18T16:00:00Z', hasRecording: true, transcriptStatus: 'Completed', callType: 'Video', accessLogs: [] },
];

export const mockTransactionStats = {
  todayCount: 145,
  todayAmount: 7250000,
  monthCount: 3850,
  monthAmount: 192500000
};

export const mockTransactions = [
  // 22 September 2026
  { id: 'TRX-10081', branchId: 'b1', inmateId: 'REG-CPN-2026-001', inmateName: 'Ahmad bin Jono', amount: 24000, description: 'Pemakaian Panggilan Video - 12 Menit', officerId: null, officerName: 'Sistem (Otomatis)', date: '2026-09-22T15:45:00Z', method: 'Potong Saldo', status: 'Berhasil', balanceBefore: 85000, balanceAfter: 61000, category: 'Panggilan', type: 'out' },
  { id: 'TRX-10082', branchId: 'b1', inmateId: 'REG-CPN-2026-001', inmateName: 'Ahmad bin Jono', amount: 15000, description: 'Pembelian Paket Telepon 25 Menit', officerId: 'u2', officerName: 'Siti Aminah', date: '2026-09-22T13:20:00Z', method: 'Potong Saldo', status: 'Berhasil', balanceBefore: 100000, balanceAfter: 85000, category: 'Kantin', type: 'out' },
  { id: 'TRX-10042', branchId: 'b2', inmateId: 'REG-CPN-2026-002', inmateName: 'Bagus S.', amount: 45000, description: 'Pembelian Paket Video Call 45 Menit', officerId: 'u12', officerName: 'Nurul Hidayah', date: '2026-09-22T11:30:00Z', method: 'Potong Saldo', status: 'Berhasil', balanceBefore: 115000, balanceAfter: 70000, category: 'Kantin', type: 'out' },
  { id: 'TRX-10043', branchId: 'b3', inmateId: 'REG-CPN-2026-005', inmateName: 'Eko Prasetyo', amount: 20000, description: 'Pembelian Paket Telepon 35 Menit', officerId: 'u4', officerName: 'Dewi Lestari', date: '2026-09-22T10:45:00Z', method: 'Potong Saldo', status: 'Gagal', balanceBefore: 12000, balanceAfter: 12000, category: 'Kantin', type: 'out' },
  { id: 'TRX-10083', branchId: 'b1', inmateId: 'REG-CPN-2026-011', inmateName: 'Kiki Fatmala', amount: 10000, description: 'Pemakaian Panggilan Suara - 8 Menit', officerId: null, officerName: 'Sistem (Otomatis)', date: '2026-09-22T10:15:00Z', method: 'Potong Saldo', status: 'Berhasil', balanceBefore: 35000, balanceAfter: 25000, category: 'Panggilan', type: 'out' },
  { id: 'TRX-10092', branchId: 'b4', inmateId: 'REG-CPN-2026-008', inmateName: 'Hendra Setiawan', amount: 20000, description: 'Pemakaian Panggilan Video - 10 Menit', officerId: null, officerName: 'Sistem (Otomatis)', date: '2026-09-22T09:10:00Z', method: 'Potong Saldo', status: 'Berhasil', balanceBefore: 75000, balanceAfter: 55000, category: 'Panggilan', type: 'out' },

  // 21 September 2026
  { id: 'TRX-10084', branchId: 'b1', inmateId: 'REG-CPN-2026-021', inmateName: 'Uya Kuya', amount: 30000, description: 'Pemakaian Panggilan Video - 15 Menit', officerId: null, officerName: 'Sistem (Otomatis)', date: '2026-09-21T16:30:00Z', method: 'Potong Saldo', status: 'Berhasil', balanceBefore: 170000, balanceAfter: 140000, category: 'Panggilan', type: 'out' },
  { id: 'TRX-10085', branchId: 'b1', inmateId: 'REG-CPN-2026-011', inmateName: 'Kiki Fatmala', amount: 25000, description: 'Pembelian Paket Telepon 50 Menit', officerId: 'u2', officerName: 'Siti Aminah', date: '2026-09-21T14:10:00Z', method: 'Potong Saldo', status: 'Berhasil', balanceBefore: 60000, balanceAfter: 35000, category: 'Kantin', type: 'out' },
  { id: 'TRX-10093', branchId: 'b3', inmateId: 'REG-CPN-2026-014', inmateName: 'Novan', amount: 17500, description: 'Pemakaian Panggilan Suara - 14 Menit', officerId: null, officerName: 'Sistem (Otomatis)', date: '2026-09-21T11:20:00Z', method: 'Potong Saldo', status: 'Berhasil', balanceBefore: 95000, balanceAfter: 77500, category: 'Panggilan', type: 'out' },
  { id: 'TRX-10048', branchId: 'b8', inmateId: 'REG-CPN-2026-007', inmateName: 'Gilang Ramadhan', amount: 30000, description: 'Pembelian Paket Telepon 60 Menit', officerId: 'u18', officerName: 'Bambang Pamungkas', date: '2026-09-21T09:45:00Z', method: 'Potong Saldo', status: 'Berhasil', balanceBefore: 45000, balanceAfter: 15000, category: 'Kantin', type: 'out' },
  { id: 'TRX-10094', branchId: 'b7', inmateId: 'REG-CPN-2026-006', inmateName: 'Ferry H.', amount: 16000, description: 'Pemakaian Panggilan Video - 8 Menit', officerId: null, officerName: 'Sistem (Otomatis)', date: '2026-09-21T08:30:00Z', method: 'Potong Saldo', status: 'Berhasil', balanceBefore: 120000, balanceAfter: 104000, category: 'Panggilan', type: 'out' },

  // 20 September 2026
  { id: 'TRX-10086', branchId: 'b1', inmateId: 'REG-CPN-2026-016', inmateName: 'Parto', amount: 7500, description: 'Pemakaian Panggilan Suara - 6 Menit', officerId: null, officerName: 'Sistem (Otomatis)', date: '2026-09-20T17:00:00Z', method: 'Potong Saldo', status: 'Berhasil', balanceBefore: 115000, balanceAfter: 107500, category: 'Panggilan', type: 'out' },
  { id: 'TRX-10095', branchId: 'b1', inmateId: 'REG-CPN-2026-016', inmateName: 'Parto', amount: 16000, description: 'Pemakaian Panggilan Video - 8 Menit', officerId: null, officerName: 'Sistem (Otomatis)', date: '2026-09-20T14:45:00Z', method: 'Potong Saldo', status: 'Berhasil', balanceBefore: 131000, balanceAfter: 115000, category: 'Panggilan', type: 'out' },
  { id: 'TRX-10057', branchId: 'b1', inmateId: 'REG-CPN-2026-016', inmateName: 'Parto', amount: 35000, description: 'Pembelian Paket Video Call 30 Menit', officerId: 'u2', officerName: 'Siti Aminah', date: '2026-09-20T13:30:00Z', method: 'Potong Saldo', status: 'Berhasil', balanceBefore: 166000, balanceAfter: 131000, category: 'Kantin', type: 'out' },
  { id: 'TRX-10056', branchId: 'b8', inmateId: 'REG-CPN-2026-013', inmateName: 'Maulana', amount: 20000, description: 'Pembelian Paket Telepon 35 Menit', officerId: 'u18', officerName: 'Bambang Pamungkas', date: '2026-09-20T11:10:00Z', method: 'Potong Saldo', status: 'Berhasil', balanceBefore: 32000, balanceAfter: 12000, category: 'Kantin', type: 'out' },
  { id: 'TRX-10096', branchId: 'b6', inmateId: 'REG-CPN-2026-019', inmateName: 'Sule', amount: 50000, description: 'Pembelian Paket Combo 100 Menit & Video', officerId: 'u16', officerName: 'Eka Putra', date: '2026-09-20T09:15:00Z', method: 'Potong Saldo', status: 'Gagal', balanceBefore: 25000, balanceAfter: 25000, category: 'Kantin', type: 'out' },

  // 19 September 2026
  { id: 'TRX-10088', branchId: 'b1', inmateId: 'REG-CPN-2026-027', inmateName: 'Andi Mallarangeng', amount: 20000, description: 'Pemakaian Panggilan Video - 10 Menit', officerId: null, officerName: 'Sistem (Otomatis)', date: '2026-09-19T16:15:00Z', method: 'Potong Saldo', status: 'Berhasil', balanceBefore: 50000, balanceAfter: 30000, category: 'Panggilan', type: 'out' },
  { id: 'TRX-10097', branchId: 'b1', inmateId: 'REG-CPN-2026-027', inmateName: 'Andi Mallarangeng', amount: 8500, description: 'Pemakaian Panggilan Suara - 7 Menit', officerId: null, officerName: 'Sistem (Otomatis)', date: '2026-09-19T14:00:00Z', method: 'Potong Saldo', status: 'Berhasil', balanceBefore: 58500, balanceAfter: 50000, category: 'Panggilan', type: 'out' },
  { id: 'TRX-10089', branchId: 'b1', inmateId: 'REG-CPN-2026-027', inmateName: 'Andi Mallarangeng', amount: 50000, description: 'Pembelian Paket Combo 100 Menit & Video', officerId: 'u2', officerName: 'Siti Aminah', date: '2026-09-19T11:00:00Z', method: 'Potong Saldo', status: 'Berhasil', balanceBefore: 108500, balanceAfter: 58500, category: 'Kantin', type: 'out' },
  { id: 'TRX-10098', branchId: 'b5', inmateId: 'REG-CPN-2026-020', inmateName: 'Tukul Arwana', amount: 12500, description: 'Pemakaian Panggilan Suara - 10 Menit', officerId: null, officerName: 'Sistem (Otomatis)', date: '2026-09-19T09:30:00Z', method: 'Potong Saldo', status: 'Berhasil', balanceBefore: 85000, balanceAfter: 72500, category: 'Panggilan', type: 'out' },

  // 18 September 2026
  { id: 'TRX-10090', branchId: 'b1', inmateId: 'REG-CPN-2026-021', inmateName: 'Uya Kuya', amount: 15000, description: 'Pemakaian Panggilan Suara - 12 Menit', officerId: null, officerName: 'Sistem (Otomatis)', date: '2026-09-18T15:40:00Z', method: 'Potong Saldo', status: 'Berhasil', balanceBefore: 185000, balanceAfter: 170000, category: 'Panggilan', type: 'out' },
  { id: 'TRX-10099', branchId: 'b1', inmateId: 'REG-CPN-2026-021', inmateName: 'Uya Kuya', amount: 45000, description: 'Pembelian Paket Telepon 100 Menit', officerId: 'u2', officerName: 'Siti Aminah', date: '2026-09-18T10:20:00Z', method: 'Potong Saldo', status: 'Berhasil', balanceBefore: 230000, balanceAfter: 185000, category: 'Kantin', type: 'out' },

  // 17 September 2026
  { id: 'TRX-10091', branchId: 'b1', inmateId: 'REG-CPN-2026-027', inmateName: 'Andi Mallarangeng', amount: 6000, description: 'Pemakaian Panggilan Suara - 5 Menit', officerId: null, officerName: 'Sistem (Otomatis)', date: '2026-09-17T16:00:00Z', method: 'Potong Saldo', status: 'Berhasil', balanceBefore: 114500, balanceAfter: 108500, category: 'Panggilan', type: 'out' },
  { id: 'TRX-10100', branchId: 'b1', inmateId: 'REG-CPN-2026-001', inmateName: 'Ahmad bin Jono', amount: 12500, description: 'Pemakaian Panggilan Suara - 10 Menit', officerId: null, officerName: 'Sistem (Otomatis)', date: '2026-09-17T14:15:00Z', method: 'Potong Saldo', status: 'Berhasil', balanceBefore: 112500, balanceAfter: 100000, category: 'Panggilan', type: 'out' },
  { id: 'TRX-10074', branchId: 'b2', inmateId: 'REG-CPN-2026-010', inmateName: 'Joni Iskandar', amount: 30000, description: 'Pembelian Paket Telepon 60 Menit', officerId: 'u12', officerName: 'Nurul Hidayah', date: '2026-09-17T11:15:00Z', method: 'Potong Saldo', status: 'Berhasil', balanceBefore: 38000, balanceAfter: 8000, category: 'Kantin', type: 'out' },
  { id: 'TRX-10101', branchId: 'b1', inmateId: 'REG-CPN-2026-011', inmateName: 'Kiki Fatmala', amount: 35000, description: 'Pembelian Paket Video Call 30 Menit', officerId: 'u2', officerName: 'Siti Aminah', date: '2026-09-17T09:00:00Z', method: 'Potong Saldo', status: 'Berhasil', balanceBefore: 95000, balanceAfter: 60000, category: 'Kantin', type: 'out' },

  // 16 September 2026
  { id: 'TRX-10102', branchId: 'b1', inmateId: 'REG-CPN-2026-016', inmateName: 'Parto', amount: 10000, description: 'Pemakaian Panggilan Suara - 8 Menit', officerId: null, officerName: 'Sistem (Otomatis)', date: '2026-09-16T15:30:00Z', method: 'Potong Saldo', status: 'Berhasil', balanceBefore: 176000, balanceAfter: 166000, category: 'Panggilan', type: 'out' },
  { id: 'TRX-10103', branchId: 'b1', inmateId: 'REG-CPN-2026-027', inmateName: 'Andi Mallarangeng', amount: 25000, description: 'Pembelian Paket Telepon 50 Menit', officerId: 'u2', officerName: 'Siti Aminah', date: '2026-09-16T10:45:00Z', method: 'Potong Saldo', status: 'Berhasil', balanceBefore: 139500, balanceAfter: 114500, category: 'Kantin', type: 'out' },
];

export const mockReportData = {
  summary: {
    totalRevenue: 3125000,
    revenueChange: "+12.5%",
    totalCalls: 30,
    avgDuration: "14m 30s",
    successRate: 96.5,
  },
  compliance: {
    recordedRate: 99.2,
    avgSearchTime: 4.5,
    pendingApprovals: 42
  },
  trendData: [
    { date: '2026-09-16', revenue: 450000, calls: 5 },
    { date: '2026-09-17', revenue: 520000, calls: 6 },
    { date: '2026-09-18', revenue: 480000, calls: 4 },
    { date: '2026-09-19', revenue: 610000, calls: 5 },
    { date: '2026-09-20', revenue: 590000, calls: 3 },
    { date: '2026-09-21', revenue: 410000, calls: 4 },
    { date: '2026-09-22', revenue: 440000, calls: 3 },
  ],
  branchRankings: [
    { id: 'b1', name: 'Lapas Kelas I Cipinang', calls: 8, revenue: 850000, successRate: 97.2, avgDuration: '15m 10s' },
    { id: 'b8', name: 'Lapas Kelas I Lowokwaru', calls: 5, revenue: 650000, successRate: 96.8, avgDuration: '14m 50s' },
    { id: 'b2', name: 'Lapas Pemuda Kelas IIA Tangerang', calls: 5, revenue: 580000, successRate: 95.5, avgDuration: '13m 40s' },
    { id: 'b3', name: 'Lapas Narkotika Kelas IIA Jakarta', calls: 4, revenue: 490000, successRate: 96.0, avgDuration: '14m 15s' },
    { id: 'b6', name: 'Rutan Kelas I Medaeng', calls: 3, revenue: 320000, successRate: 94.2, avgDuration: '12m 30s' },
    { id: 'b7', name: 'Lapas Kelas IIA Kerobokan', calls: 2, revenue: 260000, successRate: 98.1, avgDuration: '16m 00s' },
    { id: 'b5', name: 'Lapas Perempuan Kelas IIA Malang', calls: 2, revenue: 210000, successRate: 97.5, avgDuration: '17m 20s' },
    { id: 'b4', name: 'Lapas Kelas I Sukamiskin', calls: 1, revenue: 140000, successRate: 99.0, avgDuration: '18m 45s' },
  ]
};

// -------------------------------------------------------------
// INMATES / WARGA BINAAN (WBP) DATASET
// -------------------------------------------------------------
export let mockInmates = [
  { id: 'wbp-101', wbpRegNumber: 'REG-CPN-2026-001', name: 'Ahmad Supriyadi', nik: '3175081203890001', birthPlace: 'Jakarta', birthDate: '1989-03-12', gender: 'Laki-laki', branchId: 'b1', branchName: 'Lapas Kelas I Cipinang', blockRoom: 'Blok A / Kamar 3A', entryDate: '2024-01-15', status: 'Aktif', commStatus: 'Aktif', callBalance: 150000 },
  { id: 'wbp-102', wbpRegNumber: 'REG-CPN-2026-002', name: 'Budi Santoso', nik: '3175081504910002', birthPlace: 'Bandung', birthDate: '1991-04-15', gender: 'Laki-laki', branchId: 'b1', branchName: 'Lapas Kelas I Cipinang', blockRoom: 'Blok A / Kamar 1B', entryDate: '2024-03-10', status: 'Aktif', commStatus: 'Aktif', callBalance: 75000 },
  { id: 'wbp-103', wbpRegNumber: 'REG-CPN-2026-003', name: 'Joko Widodo', nik: '3175082006880003', birthPlace: 'Solo', birthDate: '1988-06-20', gender: 'Laki-laki', branchId: 'b1', branchName: 'Lapas Kelas I Cipinang', blockRoom: 'Blok B / Kamar 2C', entryDate: '2024-05-22', status: 'Aktif', commStatus: 'Aktif', callBalance: 200000 },
  { id: 'wbp-104', wbpRegNumber: 'REG-CPN-2026-004', name: 'Andi Mallarangeng', nik: '3175081111850004', birthPlace: 'Makassar', birthDate: '1985-11-11', gender: 'Laki-laki', branchId: 'b1', branchName: 'Lapas Kelas I Cipinang', blockRoom: 'Blok C / Kamar 4A', entryDate: '2023-11-05', status: 'Aktif', commStatus: 'Nonaktif', callBalance: 50000 },
  { id: 'wbp-105', wbpRegNumber: 'REG-CPN-2026-005', name: 'Rudi Salam', nik: '3175080507920005', birthPlace: 'Surabaya', birthDate: '1992-07-05', gender: 'Laki-laki', branchId: 'b1', branchName: 'Lapas Kelas I Cipinang', blockRoom: 'Blok A / Kamar 2B', entryDate: '2024-02-18', status: 'Aktif', commStatus: 'Aktif', callBalance: 125000 },
  { id: 'wbp-106', wbpRegNumber: 'REG-CPN-2026-006', name: 'Tono Setiawan', nik: '3175081809900006', birthPlace: 'Semarang', birthDate: '1990-09-18', gender: 'Laki-laki', branchId: 'b1', branchName: 'Lapas Kelas I Cipinang', blockRoom: 'Blok B / Kamar 1A', entryDate: '2024-06-01', status: 'Aktif', commStatus: 'Aktif', callBalance: 90000 },
  { id: 'wbp-107', wbpRegNumber: 'REG-CPN-2026-007', name: 'Rahmat Hidayat', nik: '3175082512870007', birthPlace: 'Medan', birthDate: '1987-12-25', gender: 'Laki-laki', branchId: 'b1', branchName: 'Lapas Kelas I Cipinang', blockRoom: 'Blok C / Kamar 3B', entryDate: '2023-08-14', status: 'Sudah Bebas', commStatus: 'Nonaktif', callBalance: 0 },
  { id: 'wbp-108', wbpRegNumber: 'REG-CPN-2026-008', name: 'Kiki Fatmala', nik: '3175081402930008', birthPlace: 'Jakarta', birthDate: '1993-02-14', gender: 'Perempuan', branchId: 'b1', branchName: 'Lapas Kelas I Cipinang', blockRoom: 'Blok Wanita / Kamar 1', entryDate: '2024-04-09', status: 'Aktif', commStatus: 'Aktif', callBalance: 60000 },
  { id: 'wbp-109', wbpRegNumber: 'REG-CPN-2026-009', name: 'Parto Suwito', nik: '3175080101860009', birthPlace: 'Yogyakarta', birthDate: '1986-01-01', gender: 'Laki-laki', branchId: 'b1', branchName: 'Lapas Kelas I Cipinang', blockRoom: 'Blok B / Kamar 4C', entryDate: '2023-12-20', status: 'Dipindahkan', commStatus: 'Nonaktif', callBalance: 0 },
  { id: 'wbp-110', wbpRegNumber: 'REG-CPN-2026-010', name: 'Uya Kuya', nik: '3175080404940010', birthPlace: 'Bandung', birthDate: '1994-04-04', gender: 'Laki-laki', branchId: 'b1', branchName: 'Lapas Kelas I Cipinang', blockRoom: 'Blok A / Kamar 5B', entryDate: '2024-07-11', status: 'Aktif', commStatus: 'Aktif', callBalance: 300000 },
  { id: 'wbp-111', wbpRegNumber: 'REG-CPN-2026-011', name: 'Ahmad bin Jono', nik: '3175083008850011', birthPlace: 'Bogor', birthDate: '1985-08-30', gender: 'Laki-laki', branchId: 'b1', branchName: 'Lapas Kelas I Cipinang', blockRoom: 'Blok C / Kamar 1A', entryDate: '2024-01-05', status: 'Aktif', commStatus: 'Aktif', callBalance: 70000 },
  { id: 'wbp-112', wbpRegNumber: 'REG-CPN-2026-012', name: 'Candra Wijaya', nik: '3175080909950012', birthPlace: 'Palembang', birthDate: '1995-09-09', gender: 'Laki-laki', branchId: 'b1', branchName: 'Lapas Kelas I Cipinang', blockRoom: 'Blok B / Kamar 3B', entryDate: '2024-08-19', status: 'Aktif', commStatus: 'Aktif', callBalance: 45000 },
  { id: 'wbp-113', wbpRegNumber: 'REG-CPN-2026-013', name: 'Sule Sutisna', nik: '3175081511890013', birthPlace: 'Cimahi', birthDate: '1989-11-15', gender: 'Laki-laki', branchId: 'b1', branchName: 'Lapas Kelas I Cipinang', blockRoom: 'Blok A / Kamar 4A', entryDate: '2023-09-01', status: 'Sudah Bebas', commStatus: 'Nonaktif', callBalance: 0 },
  { id: 'wbp-114', wbpRegNumber: 'REG-CPN-2026-014', name: 'Dedi Mulyadi', nik: '3175082802880014', birthPlace: 'Purwakarta', birthDate: '1988-02-28', gender: 'Laki-laki', branchId: 'b1', branchName: 'Lapas Kelas I Cipinang', blockRoom: 'Blok C / Kamar 2B', entryDate: '2024-03-25', status: 'Aktif', commStatus: 'Aktif', callBalance: 110000 },
  { id: 'wbp-115', wbpRegNumber: 'REG-CPN-2026-015', name: 'Hendra Hermawan', nik: '3175081708910015', birthPlace: 'Cirebon', birthDate: '1991-08-17', gender: 'Laki-laki', branchId: 'b1', branchName: 'Lapas Kelas I Cipinang', blockRoom: 'Blok B / Kamar 5A', entryDate: '2024-05-02', status: 'Aktif', commStatus: 'Aktif', callBalance: 85000 }
];

export const getInmates = () => mockInmates;

export const getInmateById = (id) => mockInmates.find(i => i.id === id);

export const addInmate = (newInmate) => {
  const id = `wbp-${Date.now()}`;
  const inmate = {
    id,
    commStatus: 'Aktif',
    callBalance: 0,
    status: 'Aktif',
    branchId: 'b1',
    branchName: 'Lapas Kelas I Cipinang',
    ...newInmate
  };
  mockInmates = [inmate, ...mockInmates];
  return inmate;
};

export const updateInmate = (id, updatedFields) => {
  mockInmates = mockInmates.map(i => i.id === id ? { ...i, ...updatedFields } : i);
  return getInmateById(id);
};

export const toggleInmateCommStatus = (id) => {
  const inmate = getInmateById(id);
  if (inmate) {
    const newStatus = inmate.commStatus === 'Aktif' ? 'Nonaktif' : 'Aktif';
    return updateInmate(id, { commStatus: newStatus });
  }
  return null;
};
