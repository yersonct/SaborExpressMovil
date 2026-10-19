export interface PublicBranch {
  id: number;
  name: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  isActive?: boolean;
  isOpen?: boolean;
  hasSchedule?: boolean;
  openingTime?: string;
  closingTime?: string;
  unavailableReason?: string | null;
}
