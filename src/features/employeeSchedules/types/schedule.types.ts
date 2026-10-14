export interface CurrentShiftResponse {
  hasActiveShift: boolean;
  scheduleId: number | null;
  roleId: number | null;
  roleName: string | null;
  startTime: string | null;
  endTime: string | null;
}
