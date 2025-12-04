import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useDataStore, type Report } from '@/lib/data-store';
import { useState } from 'react';
import {
  BarChart3,
  FileText,
  Download,
  Calendar,
  Clock,
  Plus,
  Play,
  Loader2,
  Trash2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const reportTypes: Report['type'][] = ['Cost Analysis', 'Utilization', 'Recommendations', 'Cost Allocation', 'Budget'];
const scheduleOptions: Report['schedule'][] = ['Daily', 'Weekly', 'Monthly', 'On-demand'];

export default function Reports() {
  const { reports, addReport, deleteReport, runReport, downloadReport } = useDataStore();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [runningReports, setRunningReports] = useState<Set<string>>(new Set());

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: '' as Report['type'] | '',
    schedule: 'Monthly' as Report['schedule'],
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      schedule: 'Monthly',
    });
  };

  const handleAddReport = () => {
    if (!formData.name || !formData.type) return;

    addReport({
      name: formData.name,
      type: formData.type as Report['type'],
      schedule: formData.schedule,
    });

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleRunReport = async (reportId: string) => {
    setRunningReports(prev => new Set(prev).add(reportId));
    await runReport(reportId);
    setRunningReports(prev => {
      const next = new Set(prev);
      next.delete(reportId);
      return next;
    });
  };

  const getStatusIcon = (status: Report['status'], reportId: string) => {
    if (runningReports.has(reportId)) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    switch (status) {
      case 'ready':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusBadge = (status: Report['status'], reportId: string) => {
    if (runningReports.has(reportId)) {
      return (
        <Badge className="text-xs bg-blue-500/10 text-blue-500">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Running
        </Badge>
      );
    }
    switch (status) {
      case 'ready':
        return (
          <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Ready
          </Badge>
        );
      case 'running':
        return (
          <Badge className="text-xs bg-blue-500/10 text-blue-500">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Running
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="text-xs">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-[1920px] mx-auto" data-testid="reports-page">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between gap-4 mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reports</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Generate and schedule cost reports
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Create Report
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Report</DialogTitle>
                <DialogDescription>
                  Set up a new report to track cloud costs and usage.
                </DialogDescription>
              </DialogHeader>
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
                  <Select value={formData.type} onValueChange={(v: Report['type']) => setFormData({ ...formData, type: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="schedule">Schedule</Label>
                  <Select value={formData.schedule} onValueChange={(v: Report['schedule']) => setFormData({ ...formData, schedule: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {scheduleOptions.map((schedule) => (
                        <SelectItem key={schedule} value={schedule}>{schedule}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { resetForm(); setIsAddDialogOpen(false); }}>
                  Cancel
                </Button>
                <Button onClick={handleAddReport} disabled={!formData.name || !formData.type}>
                  Create Report
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Reports', value: reports.length, icon: FileText, color: 'text-primary' },
            { label: 'Scheduled', value: reports.filter(r => r.schedule !== 'On-demand').length, icon: Calendar, color: 'text-blue-500' },
            { label: 'Ready', value: reports.filter(r => r.status === 'ready').length, icon: CheckCircle2, color: 'text-emerald-500' },
            { label: 'On-demand', value: reports.filter(r => r.schedule === 'On-demand').length, icon: Play, color: 'text-amber-500' },
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
                    <div className={cn(
                      "p-2.5 rounded-xl",
                      stat.color === 'text-emerald-500' ? 'bg-emerald-500/10' :
                      stat.color === 'text-amber-500' ? 'bg-amber-500/10' :
                      stat.color === 'text-blue-500' ? 'bg-blue-500/10' : 'bg-primary/10'
                    )}>
                      <stat.icon className={cn("h-6 w-6", stat.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Scheduled Reports
                <Badge variant="secondary" className="ml-2">{reports.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.map((report, index) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 * index }}
                    className="p-4 rounded-lg border border-border bg-background/50 hover-elevate group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{report.name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge variant="secondary" className="text-xs">{report.type}</Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{report.schedule}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>Last: {report.lastRun}</span>
                            </div>
                            {getStatusBadge(report.status, report.id)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadReport(report.id)}
                          disabled={runningReports.has(report.id)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRunReport(report.id)}
                          disabled={runningReports.has(report.id)}
                        >
                          {runningReports.has(report.id) ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Running...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Run Now
                            </>
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Report</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{report.name}"? This action cannot be undone.
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
                  </motion.div>
                ))}

                {reports.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Reports Found</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create a report to start tracking your cloud costs.
                    </p>
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Report
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ScrollArea>
  );
}
