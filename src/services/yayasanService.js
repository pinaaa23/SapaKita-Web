import * as kanwilService from './kanwilService';

export * from './kanwilService';

export const getAllYayasansForSuperadmin = kanwilService.getAllKanwilsForSuperadmin;
export const getYayasanAdmins = kanwilService.getKanwilAdmins;
export const createYayasanAdmin = kanwilService.createKanwilAdmin;
export const resetYayasanAdminPassword = kanwilService.resetKanwilAdminPassword;
export const getYayasanInmates = kanwilService.getKanwilInmates;
export const getYayasanBranches = kanwilService.getKanwilBranches;
export const getYayasanDashboardSummary = kanwilService.getKanwilDashboardSummary;
export const getYayasanReportSummary = kanwilService.getKanwilReportSummary;
export const saveYayasanFromSuperadmin = kanwilService.saveKanwilFromSuperadmin;
export const deleteYayasanFromSuperadmin = kanwilService.deleteKanwilFromSuperadmin;
export const toggleYayasanStatus = kanwilService.toggleKanwilStatus;
export const createYayasanBranch = kanwilService.createKanwilBranch;
export const getYayasanAuditReport = kanwilService.getKanwilAuditReport;
export const assignBranchYayasan = kanwilService.assignBranchKanwil;
export const getAllAvailableUptsForSuperadmin = kanwilService.getAllAvailableUptsForSuperadmin;
export const isYayasanDemoEnabled = kanwilService.isKanwilDemoEnabled;
export const authenticateYayasan = kanwilService.authenticateKanwil;
export const getYayasanBranchAdmins = kanwilService.getKanwilBranchAdmins;
