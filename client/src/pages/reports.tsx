import { MdAccessTime, MdAdd, MdBarChart, MdCalendarToday, MdCancel, MdCheckCircle, MdChevronLeft, MdChevronRight, MdClose, MdDelete, MdDescription, MdDownload, MdEmail, MdExpandMore, MdFilterList, MdFirstPage, MdInsertDriveFile, MdLastPage, MdPeople, MdPlayArrow, MdSearch, MdShare, MdSync, MdTableChart, MdVisibility } from 'react-icons/md';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDataStore, type Report, type ReportType, type ExportFormat, type ReportFilters } from '@/lib/data-store';
import { mockTenants } from '@/lib/mock-data';
import { serviceInfo } from '@shared/schema';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const reportTypes: ReportType[] = [
  'Cost Summary',
  'Tenant Cost',
  'Service Cost',
  'Resource Cost',
  'Budget Utilization',
  'Budget Breach',
  'Savings Opportunities',
  'Idle Resource',
  'Custom',
];

const scheduleOptions: Report['schedule'][] = ['Daily', 'Weekly', 'Monthly', 'On-demand'];

const exportFormats: { value: ExportFormat; label: string; icon: typeof MdDescription }[] = [
  { value: 'csv', label: 'CSV', icon: MdDescription },
  { value: 'pdf', label: 'PDF', icon: MdInsertDriveFile },
  { value: 'excel', label: 'Excel', icon: MdTableChart },
];

const reportTypeDescriptions: Record<ReportType, string> = {
  'Cost Summary': 'Overall cost summary across all tenants and services with trend analysis.',
  'Tenant Cost': 'Detailed cost breakdown by tenant including month-over-month comparison.',
  'Service Cost': 'Cost analysis per Huawei Cloud service with usage patterns.',
  'Resource Cost': 'Granular resource-level cost attribution and allocation.',
  'Budget Utilization': 'Budget consumption percentage and remaining capacity across all entities.',
  'Budget Breach': 'Entities that have breached or are near breaching budget thresholds.',
  'Savings Opportunities': 'Identified cost optimization and savings opportunities with estimated impact.',
  'Idle Resource': 'Unused or underutilized resources that can be reclaimed or downsized.',
  'Custom': 'Build a custom report by selecting specific tenants, services, and metrics.',
};

const reportTypeCategories: Record<string, ReportType[]> = {
  'Standard Reports': ['Cost Summary', 'Tenant Cost', 'Service Cost', 'Resource Cost'],
  'Budget Reports': ['Budget Utilization', 'Budget Breach'],
  'Optimization Reports': ['Savings Opportunities', 'Idle Resource'],
  'Custom': ['Custom'],
};

const metricsOptions = ['Cost', 'Utilization', 'Budget', 'Recommendations'];

const serviceNames = Object.keys(serviceInfo) as (keyof typeof serviceInfo)[];

// Mock preview data generators
function getPreviewData(reportType: ReportType): { headers: string[]; rows: string[][] } {
  switch (reportType) {
    case 'Cost Summary':
      return {
        headers: ['Month', 'Total Cost', 'Change', 'Top Service'],
        rows: [
          ['Jan 2024', '$185,000', '+5.2%', 'ECS'],
          ['Dec 2023', '$175,800', '+3.1%', 'ECS'],
          ['Nov 2023', '$170,500', '-1.8%', 'RDS'],
          ['Oct 2023', '$173,600', '+2.4%', 'ECS'],
          ['Sep 2023', '$169,500', '+4.0%', 'OBS'],
        ],
      };
    case 'Tenant Cost':
      return {
        headers: ['Tenant', 'Current Month', 'Previous Month', 'Change'],
        rows: [
          ['Dangote Industries', '$45,200', '$42,800', '+5.6%'],
          ['MTN Nigeria', '$78,500', '$76,100', '+3.2%'],
          ['Flutterwave', '$32,100', '$33,500', '-4.2%'],
          ['Safaricom Kenya', '$18,900', '$17,200', '+9.9%'],
          ['Access Bank', '$10,300', '$11,200', '-8.0%'],
        ],
      };
    case 'Service Cost':
      return {
        headers: ['Service', 'Cost', 'Usage', '% of Total'],
        rows: [
          ['ECS', '$45,000', '156 instances', '25%'],
          ['RDS', '$28,000', '42 instances', '15%'],
          ['OBS', '$15,000', '8.5 TB', '8%'],
          ['EVS', '$12,000', '45 TB', '7%'],
          ['ELB', '$8,500', '28 listeners', '5%'],
        ],
      };
    case 'Resource Cost':
      return {
        headers: ['Resource ID', 'Service', 'Tenant', 'Monthly Cost'],
        rows: [
          ['ecs-prod-web-01', 'ECS', 'MTN Nigeria', '$2,400'],
          ['rds-primary-db', 'RDS', 'Dangote Industries', '$1,800'],
          ['obs-media-store', 'OBS', 'Flutterwave', '$1,200'],
          ['ecs-api-cluster', 'ECS', 'MTN Nigeria', '$3,600'],
          ['evs-backup-vol', 'EVS', 'Safaricom Kenya', '$800'],
        ],
      };
    case 'Budget Utilization':
      return {
        headers: ['Entity', 'Budget', 'Spent', 'Utilization'],
        rows: [
          ['Dangote Industries', '$250,000', '$212,500', '85%'],
          ['MTN Nigeria', '$500,000', '$425,000', '85%'],
          ['Flutterwave', '$180,000', '$135,000', '75%'],
          ['Safaricom Kenya', '$120,000', '$96,000', '80%'],
          ['Access Bank', '$90,000', '$81,000', '90%'],
        ],
      };
    case 'Budget Breach':
      return {
        headers: ['Entity', 'Budget', 'Actual', 'Breach %'],
        rows: [
          ['Access Bank', '$90,000', '$97,200', '+8.0%'],
          ['IT Division (Dangote)', '$112,500', '$118,125', '+5.0%'],
          ['Dev Team (MTN)', '$150,000', '$157,500', '+5.0%'],
          ['Safaricom Kenya', '$120,000', '$114,000', '-5.0% (near)'],
          ['Flutterwave', '$180,000', '$171,000', '-5.0% (near)'],
        ],
      };
    case 'Savings Opportunities':
      return {
        headers: ['Opportunity', 'Category', 'Est. Savings', 'Effort'],
        rows: [
          ['Rightsize 12 ECS instances', 'Compute', '$4,200/mo', 'Easy'],
          ['Remove 8 idle volumes', 'Storage', '$1,800/mo', 'Easy'],
          ['Reserved instance purchase', 'Compute', '$8,500/mo', 'Medium'],
          ['Consolidate 3 RDS instances', 'Database', '$2,100/mo', 'Hard'],
          ['Enable auto-scaling', 'Compute', '$3,400/mo', 'Medium'],
        ],
      };
    case 'Idle Resource':
      return {
        headers: ['Resource', 'Service', 'Idle Since', 'Monthly Cost'],
        rows: [
          ['ecs-staging-03', 'ECS', '2023-11-15', '$450'],
          ['evs-old-backup', 'EVS', '2023-10-01', '$120'],
          ['eip-unused-01', 'EIP', '2023-12-20', '$35'],
          ['rds-test-db-02', 'RDS', '2023-09-05', '$280'],
          ['obs-temp-bucket', 'OBS', '2023-11-30', '$65'],
        ],
      };
    case 'Custom':
    default:
      return {
        headers: ['Metric', 'Value', 'Trend', 'Period'],
        rows: [
          ['Total Cost', '$185,000', '+5.2%', 'Jan 2024'],
          ['Avg Utilization', '72%', '+3%', 'Jan 2024'],
          ['Budget Usage', '85%', '+2%', 'Jan 2024'],
          ['Active Recommendations', '24', '-5', 'Jan 2024'],
          ['Idle Resources', '12', '+2', 'Jan 2024'],
        ],
      };
  }
}

export default function Reports() {
  const { reports, addReport, deleteReport, runReport, downloadReport, shareReport } = useDataStore();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareTargetId, setShareTargetId] = useState<string | null>(null);
  const [shareEmailInput, setShareEmailInput] = useState('');
  const [shareEmails, setShareEmails] = useState<string[]>([]);
  const [previewReportId, setPreviewReportId] = useState<string | null>(null);
  const [runningReports, setRunningReports] = useState<Set<string>>(new Set());
  const [createStep, setCreateStep] = useState(1);

  // FilterList/search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ReportType | 'all'>('all');
  const [filterSchedule, setFilterSchedule] = useState<Report['schedule'] | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<Report['status'] | 'all'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    type: ReportType | '';
    schedule: Report['schedule'];
    exportFormat: ExportFormat;
    description: string;
    filters: ReportFilters;
  }>({
    name: '',
    type: '',
    schedule: 'Monthly',
    exportFormat: 'csv',
    description: '',
    filters: { tenants: [], services: [], dateRange: 'Last 30 days', metrics: [] },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      schedule: 'Monthly',
      exportFormat: 'csv',
      description: '',
      filters: { tenants: [], services: [], dateRange: 'Last 30 days', metrics: [] },
    });
    setCreateStep(1);
  };

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch =
        !searchQuery ||
        report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || report.type === filterType;
      const matchesSchedule = filterSchedule === 'all' || report.schedule === filterSchedule;
      const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
      return matchesSearch && matchesType && matchesSchedule && matchesStatus;
    });
  }, [reports, searchQuery, filterType, filterSchedule, filterStatus]);

  // Reset to page 1 when filters change
  const totalPages = Math.max(1, Math.ceil(filteredReports.length / ITEMS_PER_PAGE));
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  const resetPage = () => setCurrentPage(1);

  const handleAddReport = () => {
    if (!formData.name || !formData.type) return;

    const description =
      formData.description || reportTypeDescriptions[formData.type as ReportType] || '';

    addReport({
      name: formData.name,
      type: formData.type as ReportType,
      schedule: formData.schedule,
      exportFormat: formData.exportFormat,
      sharedWith: [],
      description,
      filters: formData.type === 'Custom' ? formData.filters : {},
    });

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleRunReport = async (reportId: string) => {
    setRunningReports((prev) => new Set(prev).add(reportId));
    await runReport(reportId);
    setRunningReports((prev) => {
      const next = new Set(prev);
      next.delete(reportId);
      return next;
    });
  };

  const handleOpenShare = (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    setShareTargetId(reportId);
    setShareEmails(report?.sharedWith ? [...report.sharedWith] : []);
    setShareEmailInput('');
    setIsShareDialogOpen(true);
  };

  const handleAddShareEmail = () => {
    const email = shareEmailInput.trim();
    if (email && email.includes('@') && !shareEmails.includes(email)) {
      setShareEmails([...shareEmails, email]);
      setShareEmailInput('');
    }
  };

  const handleRemoveShareEmail = (email: string) => {
    setShareEmails(shareEmails.filter((e) => e !== email));
  };

  const handleShareSubmit = () => {
    if (shareTargetId && shareEmails.length > 0) {
      shareReport(shareTargetId, shareEmails);
    }
    setIsShareDialogOpen(false);
    setShareTargetId(null);
    setShareEmails([]);
  };

  const handleTypeChange = (type: ReportType) => {
    setFormData({
      ...formData,
      type,
      description: reportTypeDescriptions[type] || '',
    });
  };

  const toggleFilterTenant = (tenantId: string) => {
    const current = formData.filters.tenants || [];
    const updated = current.includes(tenantId)
      ? current.filter((t) => t !== tenantId)
      : [...current, tenantId];
    setFormData({ ...formData, filters: { ...formData.filters, tenants: updated } });
  };

  const toggleFilterService = (service: string) => {
    const current = formData.filters.services || [];
    const updated = current.includes(service)
      ? current.filter((s) => s !== service)
      : [...current, service];
    setFormData({ ...formData, filters: { ...formData.filters, services: updated } });
  };

  const toggleFilterMetric = (metric: string) => {
    const current = formData.filters.metrics || [];
    const updated = current.includes(metric)
      ? current.filter((m) => m !== metric)
      : [...current, metric];
    setFormData({ ...formData, filters: { ...formData.filters, metrics: updated } });
  };

  const getStatusBadge = (status: Report['status'], reportId: string) => {
    if (runningReports.has(reportId)) {
      return (
        <Badge className="text-xs bg-blue-500/10 text-blue-500">
          <MdSync className="h-3 w-3 mr-1 animate-spin" />
          Running
        </Badge>
      );
    }
    switch (status) {
      case 'ready':
        return (
          <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-500">
            <MdCheckCircle className="h-3 w-3 mr-1" />
            Ready
          </Badge>
        );
      case 'running':
        return (
          <Badge className="text-xs bg-blue-500/10 text-blue-500">
            <MdSync className="h-3 w-3 mr-1 animate-spin" />
            Running
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="text-xs">
            <MdCancel className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
    }
  };

  const getFormatBadge = (format: ExportFormat) => {
    const colors: Record<ExportFormat, string> = {
      csv: 'bg-green-500/10 text-green-500',
      pdf: 'bg-red-500/10 text-red-500',
      excel: 'bg-blue-500/10 text-blue-500',
    };
    return (
      <Badge variant="secondary" className={cn('text-xs uppercase', colors[format])}>
        {format}
      </Badge>
    );
  };

  const previewReport = previewReportId ? reports.find((r) => r.id === previewReportId) : null;
  const previewData = previewReport ? getPreviewData(previewReport.type) : null;

  return (
    <ScrollArea className="h-full">
      <section aria-label="Reports" className="p-6 max-w-[1920px] mx-auto" data-testid="reports-page">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between gap-4 mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <MdBarChart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Reports</h1>
              <p className="text-sm text-muted-foreground">Generate, schedule, and share cost and optimization reports</p>
            </div>
          </div>
          <Dialog
            open={isAddDialogOpen}
            onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <MdAdd className="h-4 w-4 mr-2" />
                Create Report
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Create New Report
                  {formData.type === 'Custom' && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      - Step {createStep} of 2
                    </span>
                  )}
                </DialogTitle>
                <DialogDescription>
                  Set up a new report to track cloud costs and usage.
                </DialogDescription>
              </DialogHeader>

              {/* Step 1: Basic info (always shown) */}
              {(formData.type !== 'Custom' || createStep === 1) && (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Report Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Monthly Cost Summary"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="type">Report Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(v) => handleTypeChange(v as ReportType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(reportTypeCategories).map(([category, types]) => (
                          <div key={category}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                              {category}
                            </div>
                            {types.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.type && (
                      <p className="text-xs text-muted-foreground">
                        {reportTypeDescriptions[formData.type as ReportType]}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="Optional description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="schedule">Schedule</Label>
                      <Select
                        value={formData.schedule}
                        onValueChange={(v: Report['schedule']) =>
                          setFormData({ ...formData, schedule: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {scheduleOptions.map((schedule) => (
                            <SelectItem key={schedule} value={schedule}>
                              {schedule}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="format">Export Format</Label>
                      <Select
                        value={formData.exportFormat}
                        onValueChange={(v: ExportFormat) =>
                          setFormData({ ...formData, exportFormat: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {exportFormats.map((fmt) => (
                            <SelectItem key={fmt.value} value={fmt.value}>
                              {fmt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Custom report builder (only for Custom type) */}
              {formData.type === 'Custom' && createStep === 2 && (
                <div className="grid gap-4 py-4">
                  {/* Tenant selection */}
                  <div className="grid gap-2">
                    <Label>Select Tenants</Label>
                    <div className="border border-border rounded-lg p-3 max-h-[140px] overflow-y-auto space-y-2">
                      {mockTenants.map((tenant) => (
                        <div key={tenant.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`tenant-${tenant.id}`}
                            checked={formData.filters.tenants?.includes(tenant.id) || false}
                            onCheckedChange={() => toggleFilterTenant(tenant.id)}
                          />
                          <label
                            htmlFor={`tenant-${tenant.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {tenant.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Service selection */}
                  <div className="grid gap-2">
                    <Label>Select Services</Label>
                    <div className="border border-border rounded-lg p-3 max-h-[140px] overflow-y-auto grid grid-cols-2 gap-2">
                      {serviceNames.map((service) => (
                        <div key={service} className="flex items-center gap-2">
                          <Checkbox
                            id={`service-${service}`}
                            checked={formData.filters.services?.includes(service) || false}
                            onCheckedChange={() => toggleFilterService(service)}
                          />
                          <label
                            htmlFor={`service-${service}`}
                            className="text-sm cursor-pointer"
                          >
                            {service}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Date range */}
                  <div className="grid gap-2">
                    <Label>Date Range</Label>
                    <Select
                      value={formData.filters.dateRange || 'Last 30 days'}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          filters: { ...formData.filters, dateRange: v },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Last 7 days">Last 7 days</SelectItem>
                        <SelectItem value="Last 30 days">Last 30 days</SelectItem>
                        <SelectItem value="Last 90 days">Last 90 days</SelectItem>
                        <SelectItem value="Last 6 months">Last 6 months</SelectItem>
                        <SelectItem value="Last 12 months">Last 12 months</SelectItem>
                        <SelectItem value="Year to date">Year to date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Metrics */}
                  <div className="grid gap-2">
                    <Label>Metrics to Include</Label>
                    <div className="flex flex-wrap gap-3">
                      {metricsOptions.map((metric) => (
                        <div key={metric} className="flex items-center gap-2">
                          <Checkbox
                            id={`metric-${metric}`}
                            checked={formData.filters.metrics?.includes(metric) || false}
                            onCheckedChange={() => toggleFilterMetric(metric)}
                          />
                          <label
                            htmlFor={`metric-${metric}`}
                            className="text-sm cursor-pointer"
                          >
                            {metric}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (formData.type === 'Custom' && createStep === 2) {
                      setCreateStep(1);
                    } else {
                      resetForm();
                      setIsAddDialogOpen(false);
                    }
                  }}
                >
                  {formData.type === 'Custom' && createStep === 2 ? 'Back' : 'Cancel'}
                </Button>
                {formData.type === 'Custom' && createStep === 1 ? (
                  <Button
                    onClick={() => setCreateStep(2)}
                    disabled={!formData.name || !formData.type}
                  >
                    Next: Configure Filters
                  </Button>
                ) : (
                  <Button onClick={handleAddReport} disabled={!formData.name || !formData.type}>
                    Create Report
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: 'Total Reports',
              value: reports.length,
              icon: MdDescription,
              color: 'text-primary',
            },
            {
              label: 'Scheduled',
              value: reports.filter((r) => r.schedule !== 'On-demand').length,
              icon: MdCalendarToday,
              color: 'text-blue-500',
            },
            {
              label: 'Ready',
              value: reports.filter((r) => r.status === 'ready').length,
              icon: MdCheckCircle,
              color: 'text-emerald-500',
            },
            {
              label: 'Shared',
              value: reports.filter((r) => r.sharedWith.length > 0).length,
              icon: MdPeople,
              color: 'text-amber-500',
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold font-mono">{stat.value}</p>
                    </div>
                    <div
                      className={cn(
                        'p-2.5 rounded-xl',
                        stat.color === 'text-emerald-500'
                          ? 'bg-emerald-500/10'
                          : stat.color === 'text-amber-500'
                            ? 'bg-amber-500/10'
                            : stat.color === 'text-blue-500'
                              ? 'bg-blue-500/10'
                              : 'bg-primary/10'
                      )}
                    >
                      <stat.icon className={cn('h-6 w-6', stat.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* FilterList Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="mb-4"
        >
          <Card className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search reports..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); resetPage(); }}
                    className="pl-9"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <MdFilterList className="h-4 w-4 text-muted-foreground" />
                  <Select
                    value={filterType}
                    onValueChange={(v) => { setFilterType(v as ReportType | 'all'); resetPage(); }}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {reportTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filterSchedule}
                    onValueChange={(v) => { setFilterSchedule(v as Report['schedule'] | 'all'); resetPage(); }}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Schedule" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Schedules</SelectItem>
                      {scheduleOptions.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filterStatus}
                    onValueChange={(v) => { setFilterStatus(v as Report['status'] | 'all'); resetPage(); }}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                      <SelectItem value="running">Running</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Report List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <MdBarChart className="h-5 w-5 text-primary" />
                Reports
                <Badge variant="secondary" className="ml-2">
                  {filteredReports.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {paginatedReports.map((report, index) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3, delay: 0.05 * Math.min(index, 10) }}
                      layout
                      className="p-4 rounded-lg border border-border bg-background/50 hover-elevate group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
                            <MdDescription className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium">{report.name}</h3>
                              {report.sharedWith.length > 0 && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <div className="flex items-center gap-1">
                                        <div className="flex -space-x-1">
                                          {report.sharedWith.slice(0, 3).map((email, i) => (
                                            <div
                                              key={i}
                                              className="h-5 w-5 rounded-full bg-primary/20 border border-background flex items-center justify-center"
                                            >
                                              <span className="text-[9px] font-medium text-primary">
                                                {email.charAt(0).toUpperCase()}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                        {report.sharedWith.length > 3 && (
                                          <span className="text-xs text-muted-foreground">
                                            +{report.sharedWith.length - 3}
                                          </span>
                                        )}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">
                                        Shared with: {report.sharedWith.join(', ')}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            {report.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {report.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              <Badge variant="secondary" className="text-xs">
                                {report.type}
                              </Badge>
                              {getFormatBadge(report.exportFormat)}
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MdCalendarToday className="h-3 w-3" />
                                <span>{report.schedule}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MdAccessTime className="h-3 w-3" />
                                <span>Last: {report.lastRun}</span>
                              </div>
                              {getStatusBadge(report.status, report.id)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Preview button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setPreviewReportId(
                                previewReportId === report.id ? null : report.id
                              )
                            }
                            disabled={report.status !== 'ready' && !runningReports.has(report.id)}
                          >
                            <MdVisibility className="h-4 w-4 mr-1" />
                            Preview
                          </Button>

                          {/* Download dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={runningReports.has(report.id)}
                              >
                                <MdDownload className="h-4 w-4 mr-1" />
                                Export
                                <MdExpandMore className="h-3 w-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => downloadReport(report.id, 'csv')}
                              >
                                <MdDescription className="h-4 w-4 mr-2" />
                                Download CSV
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => downloadReport(report.id, 'pdf')}
                              >
                                <MdInsertDriveFile className="h-4 w-4 mr-2" />
                                Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => downloadReport(report.id, 'excel')}
                              >
                                <MdTableChart className="h-4 w-4 mr-2" />
                                Download Excel
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          {/* Share button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenShare(report.id)}
                          >
                            <MdShare className="h-4 w-4 mr-1" />
                            Share
                          </Button>

                          {/* Run button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRunReport(report.id)}
                            disabled={runningReports.has(report.id)}
                          >
                            {runningReports.has(report.id) ? (
                              <>
                                <MdSync className="h-4 w-4 mr-1 animate-spin" />
                                Running...
                              </>
                            ) : (
                              <>
                                <MdPlayArrow className="h-4 w-4 mr-1" />
                                Run
                              </>
                            )}
                          </Button>

                          {/* Delete */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                              >
                                <MdDelete className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Report</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete &quot;{report.name}&quot;? This
                                  action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => deleteReport(report.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      {/* Preview Section */}
                      <AnimatePresence>
                        {previewReportId === report.id && report.status === 'ready' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 pt-4 border-t border-border">
                              <p className="text-xs font-medium text-muted-foreground mb-2">
                                Sample Preview Data
                              </p>
                              <div className="rounded-md border border-border overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      {getPreviewData(report.type).headers.map((header) => (
                                        <TableHead
                                          key={header}
                                          className="text-xs h-8 bg-muted/30"
                                        >
                                          {header}
                                        </TableHead>
                                      ))}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {getPreviewData(report.type).rows.map((row, rowIdx) => (
                                      <TableRow key={rowIdx}>
                                        {row.map((cell, cellIdx) => (
                                          <TableCell key={cellIdx} className="text-xs py-1.5">
                                            {cell}
                                          </TableCell>
                                        ))}
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {filteredReports.length === 0 && (
                  <div className="text-center py-12">
                    <MdDescription className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Reports Found</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {reports.length === 0
                        ? 'Create a report to start tracking your cloud costs.'
                        : 'No reports match your current filters.'}
                    </p>
                    {reports.length === 0 ? (
                      <Button onClick={() => setIsAddDialogOpen(true)}>
                        <MdAdd className="h-4 w-4 mr-2" />
                        Create Report
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchQuery('');
                          setFilterType('all');
                          setFilterSchedule('all');
                          setFilterStatus('all');
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {filteredReports.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredReports.length)} of {filteredReports.length} reports
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(1)}
                    >
                      <MdFirstPage className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                    >
                      <MdChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .map((page, i, arr) => (
                        <span key={page}>
                          {i > 0 && arr[i - 1] !== page - 1 && (
                            <span className="px-1 text-muted-foreground">…</span>
                          )}
                          <Button
                            variant={page === currentPage ? 'default' : 'outline'}
                            size="sm"
                            className="min-w-[32px]"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        </span>
                      ))}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                    >
                      <MdChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      <MdLastPage className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Share Dialog */}
        <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MdShare className="h-5 w-5" />
                Share Report
              </DialogTitle>
              <DialogDescription>
                Enter email addresses to share this report with.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter email address"
                    value={shareEmailInput}
                    onChange={(e) => setShareEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddShareEmail();
                      }
                    }}
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={handleAddShareEmail} className="shrink-0">
                  Add
                </Button>
              </div>
              {shareEmails.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {shareEmails.map((email) => (
                    <Badge
                      key={email}
                      variant="secondary"
                      className="flex items-center gap-1 pl-2 pr-1 py-1"
                    >
                      <span className="text-xs">{email}</span>
                      <button
                        onClick={() => handleRemoveShareEmail(email)}
                        className="ml-1 rounded-full hover:bg-muted p-0.5"
                      >
                        <MdClose className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleShareSubmit} disabled={shareEmails.length === 0}>
                <MdShare className="h-4 w-4 mr-2" />
                Share with {shareEmails.length} recipient{shareEmails.length !== 1 ? 's' : ''}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </ScrollArea>
  );
}
