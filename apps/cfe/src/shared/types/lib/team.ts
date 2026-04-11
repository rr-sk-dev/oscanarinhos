export interface TeamWebContent {
  title: string;
  subtitle: string;
  instagram?: string | null;
}

export interface Team {
  id: string;
  name: string;
  shortName: string | null;
  logo: string;
  teamPhoto: string | null;
  webContent: TeamWebContent | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamDetails {
  id: string;
  name: string;
  logo: string;
  teamPhoto: string | null;
  webContent: TeamWebContent | null;
  staffIds: string[];
}

export enum StaffRole {
  COACH = 'COACH',
  ASSISTANT_COACH = 'ASSISTANT_COACH',
  DELEGATE = 'DELEGATE',
}

export interface TeamStaff {
  id: string;
  firstName: string;
  lastName: string;
  role: StaffRole;
  dateOfBirth: string | null;
  photo: string | null;
  teamId: string;
  createdAt: string;
  updatedAt: string;
}
