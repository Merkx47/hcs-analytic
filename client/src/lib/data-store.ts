import { create } from 'zustand';
import type { Tenant, Recommendation } from '@shared/schema';
import { mockTenants as initialTenants, generateRecommendations } from './mock-data';
import { toast } from '@/hooks/use-toast';

// Budget type
export interface Budget {
  id: string;
  tenantId: string;
  name: string;
  amount: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  alertThreshold: number;
  createdAt: string;
}

// Settings types
export interface ProfileSettings {
  firstName: string;
  lastName: string;
  email: string;
}

export interface NotificationSettings {
  budgetAlerts: boolean;
  costAnomalies: boolean;
  newRecommendations: boolean;
  reportReady: boolean;
}

export interface ApiCredentials {
  accessKey: string;
  secretKey: string;
  projectId: string;
  isConnected: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
}

export interface Settings {
  profile: ProfileSettings;
  timezone: string;
  notifications: NotificationSettings;
  apiCredentials: ApiCredentials;
  security: SecuritySettings;
}

// Report type
export interface Report {
  id: string;
  name: string;
  type: 'Cost Analysis' | 'Utilization' | 'Recommendations' | 'Cost Allocation' | 'Budget';
  schedule: 'Daily' | 'Weekly' | 'Monthly' | 'On-demand';
  lastRun: string;
  status: 'ready' | 'running' | 'failed';
}

// Initial mock data
const initialBudgets: Budget[] = [
  { id: 'budget-1', tenantId: 'tenant-1', name: 'Dangote Monthly Budget', amount: 250000, period: 'monthly', alertThreshold: 80, createdAt: '2024-01-01' },
  { id: 'budget-2', tenantId: 'tenant-2', name: 'MTN Monthly Budget', amount: 500000, period: 'monthly', alertThreshold: 85, createdAt: '2024-01-01' },
  { id: 'budget-3', tenantId: 'tenant-3', name: 'Flutterwave Monthly Budget', amount: 180000, period: 'monthly', alertThreshold: 75, createdAt: '2024-01-01' },
];

const initialReports: Report[] = [
  { id: 'report-1', name: 'Monthly Cost Summary', type: 'Cost Analysis', schedule: 'Monthly', lastRun: '2024-01-01', status: 'ready' },
  { id: 'report-2', name: 'Resource Utilization Report', type: 'Utilization', schedule: 'Weekly', lastRun: '2024-01-03', status: 'ready' },
  { id: 'report-3', name: 'Optimization Opportunities', type: 'Recommendations', schedule: 'Daily', lastRun: '2024-01-05', status: 'ready' },
  { id: 'report-4', name: 'Tenant Cost Breakdown', type: 'Cost Allocation', schedule: 'Monthly', lastRun: '2024-01-01', status: 'ready' },
  { id: 'report-5', name: 'Budget vs Actual', type: 'Budget', schedule: 'Weekly', lastRun: '2024-01-04', status: 'ready' },
];

const initialSettings: Settings = {
  profile: {
    firstName: 'Chidi',
    lastName: 'Okonkwo',
    email: 'chidi@company.com',
  },
  timezone: 'africa-lagos',
  notifications: {
    budgetAlerts: true,
    costAnomalies: true,
    newRecommendations: true,
    reportReady: true,
  },
  apiCredentials: {
    accessKey: '',
    secretKey: '',
    projectId: '',
    isConnected: false,
  },
  security: {
    twoFactorEnabled: false,
  },
};

interface DataStore {
  // Tenants
  tenants: Tenant[];
  addTenant: (tenant: Omit<Tenant, 'id'>) => Tenant;
  updateTenant: (id: string, updates: Partial<Tenant>) => void;
  deleteTenant: (id: string) => void;

  // Budgets
  budgets: Budget[];
  addBudget: (budget: Omit<Budget, 'id' | 'createdAt'>) => Budget;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;

  // Reports
  reports: Report[];
  addReport: (report: Omit<Report, 'id' | 'lastRun' | 'status'>) => Report;
  updateReport: (id: string, updates: Partial<Report>) => void;
  deleteReport: (id: string) => void;
  runReport: (id: string) => Promise<void>;
  downloadReport: (id: string) => void;

  // Recommendations
  recommendations: Recommendation[];
  implementRecommendation: (id: string) => void;
  dismissRecommendation: (id: string) => void;
  implementEasyWins: () => number;

  // Settings
  settings: Settings;
  updateProfile: (profile: Partial<ProfileSettings>) => void;
  updateTimezone: (timezone: string) => void;
  updateNotifications: (notifications: Partial<NotificationSettings>) => void;
  connectApi: (credentials: Omit<ApiCredentials, 'isConnected'>) => Promise<void>;
  disconnectApi: () => void;
  updateSecurity: (security: Partial<SecuritySettings>) => void;
  changePassword: (newPassword: string) => Promise<void>;
}

export const useDataStore = create<DataStore>((set, get) => ({
  // Tenants
  tenants: [...initialTenants],

  addTenant: (tenantData) => {
    const newTenant: Tenant = {
      ...tenantData,
      id: `tenant-${Date.now()}`,
    };
    set((state) => ({ tenants: [...state.tenants, newTenant] }));
    toast({ title: 'Tenant Added', description: `${newTenant.name} has been added successfully.` });
    return newTenant;
  },

  updateTenant: (id, updates) => {
    set((state) => ({
      tenants: state.tenants.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
    toast({ title: 'Tenant Updated', description: 'Tenant details have been updated.' });
  },

  deleteTenant: (id) => {
    const tenant = get().tenants.find((t) => t.id === id);
    set((state) => ({
      tenants: state.tenants.filter((t) => t.id !== id),
      budgets: state.budgets.filter((b) => b.tenantId !== id),
    }));
    toast({ title: 'Tenant Deleted', description: `${tenant?.name} has been removed.` });
  },

  // Budgets
  budgets: [...initialBudgets],

  addBudget: (budgetData) => {
    const newBudget: Budget = {
      ...budgetData,
      id: `budget-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    set((state) => ({ budgets: [...state.budgets, newBudget] }));
    toast({ title: 'Budget Created', description: `${newBudget.name} budget has been created.` });
    return newBudget;
  },

  updateBudget: (id, updates) => {
    set((state) => ({
      budgets: state.budgets.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    }));
    toast({ title: 'Budget Updated', description: 'Budget has been updated.' });
  },

  deleteBudget: (id) => {
    set((state) => ({
      budgets: state.budgets.filter((b) => b.id !== id),
    }));
    toast({ title: 'Budget Deleted', description: 'Budget has been removed.' });
  },

  // Reports
  reports: [...initialReports],

  addReport: (reportData) => {
    const newReport: Report = {
      ...reportData,
      id: `report-${Date.now()}`,
      lastRun: 'Never',
      status: 'ready',
    };
    set((state) => ({ reports: [...state.reports, newReport] }));
    toast({ title: 'Report Created', description: `${newReport.name} has been created.` });
    return newReport;
  },

  updateReport: (id, updates) => {
    set((state) => ({
      reports: state.reports.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
  },

  deleteReport: (id) => {
    set((state) => ({
      reports: state.reports.filter((r) => r.id !== id),
    }));
    toast({ title: 'Report Deleted', description: 'Report has been removed.' });
  },

  runReport: async (id) => {
    set((state) => ({
      reports: state.reports.map((r) => (r.id === id ? { ...r, status: 'running' as const } : r)),
    }));
    toast({ title: 'Report Running', description: 'Generating report...' });

    // Simulate report generation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    set((state) => ({
      reports: state.reports.map((r) =>
        r.id === id ? { ...r, status: 'ready' as const, lastRun: new Date().toISOString().split('T')[0] } : r
      ),
    }));
    toast({ title: 'Report Ready', description: 'Your report has been generated.' });
  },

  downloadReport: (id) => {
    const report = get().reports.find((r) => r.id === id);
    if (report) {
      // Create a mock CSV content
      const csvContent = `Report: ${report.name}\nType: ${report.type}\nGenerated: ${new Date().toISOString()}\n\n"Category","Amount","Percentage"\n"ECS","$45,000","25%"\n"RDS","$28,000","15%"\n"OBS","$15,000","8%"\n"Other","$97,000","52%"`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: 'Download Started', description: `${report.name} is being downloaded.` });
    }
  },

  // Recommendations
  recommendations: generateRecommendations('all'),

  implementRecommendation: (id) => {
    set((state) => ({
      recommendations: state.recommendations.map((r) =>
        r.id === id ? { ...r, status: 'implemented' as const } : r
      ),
    }));
    const rec = get().recommendations.find((r) => r.id === id);
    toast({
      title: 'Recommendation Implemented',
      description: `Saved $${rec?.projectedSavings.toFixed(2)} per month.`,
    });
  },

  dismissRecommendation: (id) => {
    set((state) => ({
      recommendations: state.recommendations.map((r) =>
        r.id === id ? { ...r, status: 'dismissed' as const } : r
      ),
    }));
    toast({ title: 'Recommendation Dismissed' });
  },

  implementEasyWins: () => {
    const easyWins = get().recommendations.filter(
      (r) => r.effort === 'easy' && r.status === 'new'
    );
    const totalSavings = easyWins.reduce((sum, r) => sum + r.projectedSavings, 0);

    set((state) => ({
      recommendations: state.recommendations.map((r) =>
        r.effort === 'easy' && r.status === 'new' ? { ...r, status: 'implemented' as const } : r
      ),
    }));

    toast({
      title: 'Easy Wins Implemented',
      description: `${easyWins.length} recommendations implemented. Saving $${totalSavings.toFixed(2)}/month.`,
    });

    return easyWins.length;
  },

  // Settings
  settings: { ...initialSettings },

  updateProfile: (profile) => {
    set((state) => ({
      settings: {
        ...state.settings,
        profile: { ...state.settings.profile, ...profile },
      },
    }));
    toast({ title: 'Profile Updated', description: 'Your profile has been saved.' });
  },

  updateTimezone: (timezone) => {
    set((state) => ({
      settings: { ...state.settings, timezone },
    }));
    toast({ title: 'Timezone Updated', description: 'Your timezone preference has been saved.' });
  },

  updateNotifications: (notifications) => {
    set((state) => ({
      settings: {
        ...state.settings,
        notifications: { ...state.settings.notifications, ...notifications },
      },
    }));
    toast({ title: 'Notifications Updated', description: 'Your notification preferences have been saved.' });
  },

  connectApi: async (credentials) => {
    toast({ title: 'Connecting...', description: 'Verifying API credentials...' });

    // Simulate API connection
    await new Promise((resolve) => setTimeout(resolve, 2000));

    set((state) => ({
      settings: {
        ...state.settings,
        apiCredentials: { ...credentials, isConnected: true },
      },
    }));
    toast({ title: 'Connected', description: 'Successfully connected to Huawei Cloud.' });
  },

  disconnectApi: () => {
    set((state) => ({
      settings: {
        ...state.settings,
        apiCredentials: { accessKey: '', secretKey: '', projectId: '', isConnected: false },
      },
    }));
    toast({ title: 'Disconnected', description: 'Disconnected from Huawei Cloud.' });
  },

  updateSecurity: (security) => {
    set((state) => ({
      settings: {
        ...state.settings,
        security: { ...state.settings.security, ...security },
      },
    }));
    const message = security.twoFactorEnabled
      ? 'Two-factor authentication has been enabled.'
      : 'Two-factor authentication has been disabled.';
    toast({ title: 'Security Updated', description: message });
  },

  changePassword: async (newPassword) => {
    if (newPassword.length < 8) {
      toast({ title: 'Error', description: 'Password must be at least 8 characters.', variant: 'destructive' });
      return;
    }

    toast({ title: 'Updating...', description: 'Changing your password...' });

    // Simulate password change
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({ title: 'Password Changed', description: 'Your password has been updated successfully.' });
  },
}));
