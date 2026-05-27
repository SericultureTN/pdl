export type UserRole = "AD_OFFICE_USER" | "MIS_ADMIN" | "SUPER_ADMIN";

export interface MeUser {
  id: number;
  email: string;
  name?: string | null;
  role: UserRole;
  adOfficeId?: number | null;
  adOfficeName?: string | null;
}

