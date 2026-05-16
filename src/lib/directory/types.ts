export type DirectoryUser = {
  id: string;
  email: string;
  givenName: string;
  familyName: string;
  jobTitle?: string;
  department?: string;
  officeLocation?: string;
  phoneNumber?: string;
  managerEmail?: string;
  startDate?: Date;
  isAdmin: boolean;
  suspended: boolean;
  image?: string;
  bio?: string;
  linkedinUrl?: string;
  workLocation?: string;
};

export type DirectoryFilter = {
  department?: string;
  officeLocation?: string;
  status?: 'active' | 'suspended';
  search?: string;
};

export interface DirectoryProvider {
  listUsers(filter?: DirectoryFilter): Promise<DirectoryUser[]>;
  getUser(id: string): Promise<DirectoryUser | null>;
  syncUsers(): Promise<number>; // Returns count of synced users
}
