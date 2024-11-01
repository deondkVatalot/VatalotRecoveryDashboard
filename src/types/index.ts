export interface User {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  role: 'admin' | 'user';
  status: 'enabled' | 'disabled';
  createdAt: string;
  theme?: 'light' | 'dark';
  settings?: {
    fontSize?: 'small' | 'medium' | 'large';
    language?: string;
    layout?: 'comfortable' | 'compact' | 'default';
  };
}

export interface UserWithPassword extends User {
  password: string;
}

export interface DataRecord {
  id: string;
  Date?: string;
  TransID?: string;
  Account?: string;
  Aname?: string;
  Reference?: string;
  Description?: string;
  Amount?: number;
  VAT?: number;
  Flag?: string;
  Verified?: string;
  Status?: string;
  Notes?: string;
  import_id?: string;
  [key: string]: any;
}

export interface DataImport {
  id: string;
  filename: string;
  importedAt: string;
  recordCount: number;
  importedBy: string;
  data?: DataRecord[];
}

export interface UserData {
  theme: 'light' | 'dark';
  settings: {
    fontSize: 'small' | 'medium' | 'large';
    language: string;
    layout: 'comfortable' | 'compact' | 'default';
  };
  dataHistory?: DataImport[];
  currentData?: DataRecord[];
}