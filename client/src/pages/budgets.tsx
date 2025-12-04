import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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
import { useFinOpsStore, formatCurrency, formatCompactCurrency } from '@/lib/finops-store';
import { useDataStore } from '@/lib/data-store';
import { generateKPIs } from '@/lib/mock-data';
import { useMemo, useState } from 'react';
import {
  Target,
  Plus,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Pencil,
  Trash2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Budgets() {
  const { currency, selectedTenantId } = useFinOpsStore();
  const { tenants, budgets, addBudget, updateBudget, deleteBudget } = useDataStore();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<typeof budgets[0] | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    tenantId: '',
    name: '',
    amount: '',
    period: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    alertThreshold: '80',
  });

  const budgetData = useMemo(() => {
    const relevantBudgets = selectedTenantId === 'all'
      ? budgets
      : budgets.filter(b => b.tenantId === selectedTenantId);

    return relevantBudgets.map(budget => {
      const tenant = tenants.find(t => t.id === budget.tenantId);
      const kpis = generateKPIs(budget.tenantId);
      const spent = kpis.totalSpend;
      const percentage = (spent / budget.amount) * 100;

      return {
        ...budget,
        tenantName: tenant?.name || 'Unknown Tenant',
        spent,
        percentage,
      };
    });
  }, [selectedTenantId, budgets, tenants]);

  // Also show tenants without explicit budgets (using their default budget)
  const tenantsWithoutBudgets = useMemo(() => {
    if (selectedTenantId !== 'all') return [];
    const budgetTenantIds = budgets.map(b => b.tenantId);
    return tenants.filter(t => !budgetTenantIds.includes(t.id)).map(tenant => {
      const kpis = generateKPIs(tenant.id);
      return {
        id: `default-${tenant.id}`,
        tenantId: tenant.id,
        name: `${tenant.name} (Default)`,
        amount: tenant.budget,
        period: 'monthly' as const,
        alertThreshold: 80,
        createdAt: '',
        tenantName: tenant.name,
        spent: kpis.totalSpend,
        percentage: kpis.budgetUsed,
        isDefault: true,
      };
    });
  }, [selectedTenantId, tenants, budgets]);

  const allBudgets = [...budgetData, ...tenantsWithoutBudgets];

  const totalBudget = allBudgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = allBudgets.reduce((sum, b) => sum + b.spent, 0);
  const overBudget = allBudgets.filter(b => b.percentage > 100).length;
  const atRisk = allBudgets.filter(b => b.percentage > 80 && b.percentage <= 100).length;

  const resetForm = () => {
    setFormData({
      tenantId: '',
      name: '',
      amount: '',
      period: 'monthly',
      alertThreshold: '80',
    });
  };

  const handleAddBudget = () => {
    if (!formData.tenantId || !formData.name || !formData.amount) return;

    addBudget({
      tenantId: formData.tenantId,
      name: formData.name,
      amount: parseFloat(formData.amount),
      period: formData.period,
      alertThreshold: parseInt(formData.alertThreshold) || 80,
    });

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditBudget = () => {
    if (!editingBudget || !formData.name || !formData.amount) return;

    updateBudget(editingBudget.id, {
      name: formData.name,
      amount: parseFloat(formData.amount),
      period: formData.period,
      alertThreshold: parseInt(formData.alertThreshold),
    });

    resetForm();
    setIsEditDialogOpen(false);
    setEditingBudget(null);
  };

  const openEditDialog = (budget: typeof budgetData[0]) => {
    setEditingBudget(budget);
    setFormData({
      tenantId: budget.tenantId,
      name: budget.name,
      amount: budget.amount.toString(),
      period: budget.period,
      alertThreshold: budget.alertThreshold.toString(),
    });
    setIsEditDialogOpen(true);
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-[1920px] mx-auto" data-testid="budgets-page">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between gap-4 mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">Budget Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track and manage cloud spending budgets
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Create Budget
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Budget</DialogTitle>
                <DialogDescription>
                  Set up a budget to track and control cloud spending.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="tenant">Tenant</Label>
                  <Select value={formData.tenantId} onValueChange={(v) => setFormData({ ...formData, tenantId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>{tenant.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Budget Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Q1 Cloud Budget"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount (USD)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="e.g., 100000"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="period">Period</Label>
                    <Select value={formData.period} onValueChange={(v: any) => setFormData({ ...formData, period: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="alertThreshold">Alert Threshold (%)</Label>
                  <Input
                    id="alertThreshold"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="80"
                    value={formData.alertThreshold}
                    onChange={(e) => setFormData({ ...formData, alertThreshold: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Get alerted when spending reaches this percentage of budget</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { resetForm(); setIsAddDialogOpen(false); }}>
                  Cancel
                </Button>
                <Button onClick={handleAddBudget} disabled={!formData.tenantId || !formData.name || !formData.amount}>
                  Create Budget
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Budget</DialogTitle>
              <DialogDescription>
                Update budget settings.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Budget Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-amount">Amount (USD)</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-period">Period</Label>
                  <Select value={formData.period} onValueChange={(v: any) => setFormData({ ...formData, period: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-alertThreshold">Alert Threshold (%)</Label>
                <Input
                  id="edit-alertThreshold"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.alertThreshold}
                  onChange={(e) => setFormData({ ...formData, alertThreshold: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { resetForm(); setIsEditDialogOpen(false); setEditingBudget(null); }}>
                Cancel
              </Button>
              <Button onClick={handleEditBudget}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Budget', value: formatCurrency(totalBudget, currency), icon: Target, color: 'text-primary', isValue: true },
            { label: 'Total Spent', value: formatCurrency(totalSpent, currency), icon: TrendingUp, color: 'text-blue-500', isValue: true },
            { label: 'At Risk', value: atRisk, icon: AlertTriangle, color: 'text-amber-500' },
            { label: 'Over Budget', value: overBudget, icon: AlertTriangle, color: 'text-destructive' },
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
                      <p className={cn(
                        "font-bold font-mono",
                        stat.isValue ? "text-xl" : "text-2xl"
                      )}>{stat.value}</p>
                    </div>
                    <div className={cn(
                      "p-2.5 rounded-xl",
                      stat.color === 'text-destructive' ? 'bg-destructive/10' :
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
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Budget Overview
                <Badge variant="secondary" className="ml-2">{allBudgets.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allBudgets.map((budget, index) => (
                  <motion.div
                    key={budget.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 * index }}
                    className="p-4 rounded-lg border border-border bg-background/50 group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium">{budget.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {budget.tenantName} • {budget.period.charAt(0).toUpperCase() + budget.period.slice(1)} Budget
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="w-24 flex justify-end">
                          {budget.percentage >= 100 ? (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Over Budget
                            </Badge>
                          ) : budget.percentage >= budget.alertThreshold ? (
                            <Badge className="text-xs bg-amber-500/10 text-amber-500">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              At Risk
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-500">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              On Track
                            </Badge>
                          )}
                        </div>
                        {!('isDefault' in budget) ? (
                          <div className="flex items-center gap-1 w-20 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(budget)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Budget</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this budget? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => deleteBudget(budget.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        ) : (
                          <div className="w-20" />
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {formatCurrency(budget.spent, currency)} of {formatCurrency(budget.amount, currency)}
                        </span>
                        <span className={cn(
                          "font-mono font-medium",
                          budget.percentage >= 100 ? "text-destructive" :
                          budget.percentage >= budget.alertThreshold ? "text-amber-500" : "text-emerald-500"
                        )}>
                          {budget.percentage.toFixed(0)}%
                        </span>
                      </div>
                      <Progress
                        value={Math.min(budget.percentage, 100)}
                        className={cn(
                          "h-2",
                          budget.percentage >= 100 && "[&>div]:bg-destructive",
                          budget.percentage >= budget.alertThreshold && budget.percentage < 100 && "[&>div]:bg-amber-500"
                        )}
                      />
                    </div>
                  </motion.div>
                ))}

                {allBudgets.length === 0 && (
                  <div className="text-center py-12">
                    <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Budgets Found</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create a budget to start tracking your cloud spending.
                    </p>
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Budget
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
