import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Bell,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  FileText,
  Users,
  Plus,
  Trash2,
  Mail,
  MessageSquare,
  Smartphone,
  Settings2,
  Target,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Mock users data - in production this would come from the data store
const availableUsers = [
  { id: '1', name: 'Chidi Okonkwo', email: 'chidi@company.com', role: 'Admin' },
  { id: '2', name: 'Adaeze Nnamdi', email: 'adaeze@company.com', role: 'User' },
  { id: '3', name: 'Emeka Eze', email: 'emeka@company.com', role: 'Viewer' },
  { id: '4', name: 'Ngozi Ibe', email: 'ngozi@company.com', role: 'Admin' },
  { id: '5', name: 'Tunde Bakare', email: 'tunde@company.com', role: 'User' },
];

// Notification categories with their metrics
const notificationCategories = [
  {
    id: 'budget',
    name: 'Budget Alerts',
    icon: Target,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    description: 'Get notified when spending approaches or exceeds budget thresholds',
    metrics: [
      { id: 'budget_80', name: '80% Budget Threshold', desc: 'Alert at 80% of budget' },
      { id: 'budget_90', name: '90% Budget Threshold', desc: 'Alert at 90% of budget' },
      { id: 'budget_100', name: 'Budget Exceeded', desc: 'Alert when budget is exceeded' },
      { id: 'budget_forecast', name: 'Budget Forecast Alert', desc: 'Alert if forecast exceeds budget' },
    ],
  },
  {
    id: 'cost',
    name: 'Cost Metrics',
    icon: DollarSign,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    description: 'Real-time cost monitoring and daily/weekly summaries',
    metrics: [
      { id: 'cost_daily', name: 'Daily Cost Summary', desc: 'Daily spending report' },
      { id: 'cost_weekly', name: 'Weekly Cost Summary', desc: 'Weekly spending report' },
      { id: 'cost_spike', name: 'Cost Spike Alert', desc: 'Alert on sudden cost increases (>20%)' },
      { id: 'cost_threshold', name: 'Custom Cost Threshold', desc: 'Alert when cost exceeds amount' },
    ],
  },
  {
    id: 'anomaly',
    name: 'Cost Anomalies',
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    description: 'Detect unusual spending patterns and potential issues',
    metrics: [
      { id: 'anomaly_high', name: 'High Severity Anomalies', desc: 'Major unexpected cost changes' },
      { id: 'anomaly_medium', name: 'Medium Severity Anomalies', desc: 'Moderate cost deviations' },
      { id: 'anomaly_resource', name: 'Resource Anomalies', desc: 'Unusual resource usage patterns' },
      { id: 'anomaly_service', name: 'Service Anomalies', desc: 'Unexpected service cost changes' },
    ],
  },
  {
    id: 'optimization',
    name: 'Optimization Recommendations',
    icon: TrendingUp,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    description: 'Cost-saving opportunities and efficiency improvements',
    metrics: [
      { id: 'opt_new', name: 'New Recommendations', desc: 'New optimization opportunities' },
      { id: 'opt_high_value', name: 'High-Value Savings', desc: 'Recommendations with >$1000 savings' },
      { id: 'opt_idle', name: 'Idle Resources', desc: 'Underutilized resource alerts' },
      { id: 'opt_rightsizing', name: 'Rightsizing Opportunities', desc: 'Resource resizing suggestions' },
    ],
  },
  {
    id: 'reports',
    name: 'Reports & Analytics',
    icon: FileText,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    description: 'Scheduled reports and analytics updates',
    metrics: [
      { id: 'report_ready', name: 'Report Ready', desc: 'Scheduled report completion' },
      { id: 'report_monthly', name: 'Monthly Summary', desc: 'End-of-month cost summary' },
      { id: 'report_trend', name: 'Trend Analysis', desc: 'Cost trend updates' },
      { id: 'report_comparison', name: 'Period Comparison', desc: 'Month-over-month comparisons' },
    ],
  },
  {
    id: 'tenant',
    name: 'Tenant & VDC Alerts',
    icon: Layers,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    description: 'Multi-tenant and VDC-specific notifications',
    metrics: [
      { id: 'tenant_budget', name: 'Tenant Budget Alert', desc: 'Per-tenant budget notifications' },
      { id: 'vdc_cost', name: 'VDC Cost Alert', desc: 'VDC-level spending alerts' },
      { id: 'tenant_new', name: 'New Tenant Activity', desc: 'New tenant onboarding alerts' },
      { id: 'vdc_threshold', name: 'VDC Threshold Alert', desc: 'VDC spending threshold alerts' },
    ],
  },
];

interface NotificationRule {
  id: string;
  categoryId: string;
  metricId: string;
  enabled: boolean;
  threshold?: number;
  recipients: string[];
  channels: ('email' | 'sms' | 'in_app')[];
}

export function NotificationSettings() {
  const [rules, setRules] = useState<NotificationRule[]>([
    { id: '1', categoryId: 'budget', metricId: 'budget_90', enabled: true, recipients: ['1', '4'], channels: ['email', 'in_app'] },
    { id: '2', categoryId: 'cost', metricId: 'cost_spike', enabled: true, threshold: 20, recipients: ['1'], channels: ['email', 'sms'] },
    { id: '3', categoryId: 'anomaly', metricId: 'anomaly_high', enabled: true, recipients: ['1', '2', '4'], channels: ['email', 'in_app'] },
    { id: '4', categoryId: 'optimization', metricId: 'opt_high_value', enabled: false, recipients: ['2'], channels: ['email'] },
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    categoryId: '',
    metricId: '',
    threshold: '',
    recipients: [] as string[],
    channels: ['email'] as ('email' | 'sms' | 'in_app')[],
  });

  const toggleRule = (ruleId: string) => {
    setRules(rules.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
  };

  const deleteRule = (ruleId: string) => {
    setRules(rules.filter(r => r.id !== ruleId));
  };

  const addRule = () => {
    if (!newRule.categoryId || !newRule.metricId || newRule.recipients.length === 0) return;

    const rule: NotificationRule = {
      id: Date.now().toString(),
      categoryId: newRule.categoryId,
      metricId: newRule.metricId,
      enabled: true,
      threshold: newRule.threshold ? parseFloat(newRule.threshold) : undefined,
      recipients: newRule.recipients,
      channels: newRule.channels,
    };

    setRules([...rules, rule]);
    setNewRule({ categoryId: '', metricId: '', threshold: '', recipients: [], channels: ['email'] });
    setIsAddDialogOpen(false);
  };

  const getCategory = (id: string) => notificationCategories.find(c => c.id === id);
  const getMetric = (categoryId: string, metricId: string) => {
    const category = getCategory(categoryId);
    return category?.metrics.find(m => m.id === metricId);
  };
  const getUser = (id: string) => availableUsers.find(u => u.id === id);

  const selectedCategory = notificationCategories.find(c => c.id === newRule.categoryId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notification Rules
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Configure who gets notified for specific metrics and thresholds
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Notification Rule</DialogTitle>
              <DialogDescription>
                Define what triggers a notification and who receives it
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Category Selection */}
              <div className="space-y-2">
                <Label>Notification Category</Label>
                <Select
                  value={newRule.categoryId}
                  onValueChange={(v) => setNewRule({ ...newRule, categoryId: v, metricId: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {notificationCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <cat.icon className={cn("h-4 w-4", cat.color)} />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Metric Selection */}
              {selectedCategory && (
                <div className="space-y-2">
                  <Label>Specific Metric</Label>
                  <Select
                    value={newRule.metricId}
                    onValueChange={(v) => setNewRule({ ...newRule, metricId: v })}
                  >
                    <SelectTrigger className="text-left [&>span]:text-left">
                      <SelectValue placeholder="Select metric" className="text-left" />
                    </SelectTrigger>
                    <SelectContent align="start">
                      {selectedCategory.metrics.map((metric) => (
                        <SelectItem key={metric.id} value={metric.id} className="text-left">
                          <div className="text-left">
                            <p className="text-left">{metric.name}</p>
                            <p className="text-xs text-muted-foreground text-left">{metric.desc}</p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Threshold (for certain metrics) */}
              {newRule.metricId && (newRule.metricId.includes('threshold') || newRule.metricId.includes('spike')) && (
                <div className="space-y-2">
                  <Label>Threshold Value</Label>
                  <Input
                    type="number"
                    placeholder={newRule.metricId.includes('spike') ? "Percentage (e.g., 20)" : "Amount in USD"}
                    value={newRule.threshold}
                    onChange={(e) => setNewRule({ ...newRule, threshold: e.target.value })}
                  />
                </div>
              )}

              {/* Recipients */}
              <div className="space-y-2">
                <Label>Recipients</Label>
                <div className="border rounded-lg p-3 space-y-2 max-h-[150px] overflow-y-auto">
                  {availableUsers.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={newRule.recipients.includes(user.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewRule({ ...newRule, recipients: [...newRule.recipients, user.id] });
                          } else {
                            setNewRule({ ...newRule, recipients: newRule.recipients.filter(id => id !== user.id) });
                          }
                        }}
                      />
                      <label
                        htmlFor={`user-${user.id}`}
                        className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        <span>{user.name}</span>
                        <span className="text-muted-foreground ml-2">({user.role})</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Channels */}
              <div className="space-y-2">
                <Label>Notification Channels</Label>
                <div className="flex gap-4">
                  {[
                    { id: 'email', icon: Mail, label: 'Email' },
                    { id: 'sms', icon: Smartphone, label: 'SMS' },
                    { id: 'in_app', icon: Bell, label: 'In-App' },
                  ].map((channel) => (
                    <div key={channel.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`channel-${channel.id}`}
                        checked={newRule.channels.includes(channel.id as any)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewRule({ ...newRule, channels: [...newRule.channels, channel.id as any] });
                          } else {
                            setNewRule({ ...newRule, channels: newRule.channels.filter(c => c !== channel.id) });
                          }
                        }}
                      />
                      <label
                        htmlFor={`channel-${channel.id}`}
                        className="flex items-center gap-1 text-sm cursor-pointer"
                      >
                        <channel.icon className="h-3.5 w-3.5" />
                        {channel.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={addRule}
                disabled={!newRule.categoryId || !newRule.metricId || newRule.recipients.length === 0}
              >
                Create Rule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Rules */}
      <Card className="bg-card/50 backdrop-blur-sm border-card-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Active Notification Rules</CardTitle>
          <CardDescription>
            {rules.filter(r => r.enabled).length} of {rules.length} rules active
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No notification rules configured</p>
              <p className="text-sm">Click "Add Rule" to create your first notification rule</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => {
                const category = getCategory(rule.categoryId);
                const metric = getMetric(rule.categoryId, rule.metricId);
                if (!category || !metric) return null;

                const Icon = category.icon;

                return (
                  <motion.div
                    key={rule.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-4 rounded-lg border transition-all",
                      rule.enabled
                        ? "bg-background/50 border-border"
                        : "bg-muted/30 border-muted opacity-60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={cn("p-2 rounded-lg", category.bgColor)}>
                          <Icon className={cn("h-4 w-4", category.color)} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">{metric.name}</h4>
                            <Badge variant="secondary" className="text-[10px]">
                              {category.name}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{metric.desc}</p>

                          {/* Recipients */}
                          <div className="flex items-center gap-2 mt-2">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <div className="flex gap-1 flex-wrap">
                              {rule.recipients.map((rid) => {
                                const user = getUser(rid);
                                return user ? (
                                  <Badge key={rid} variant="outline" className="text-[10px] px-1.5 py-0">
                                    {user.name.split(' ')[0]}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          </div>

                          {/* Channels */}
                          <div className="flex items-center gap-2 mt-1.5">
                            {rule.channels.includes('email') && <Mail className="h-3 w-3 text-muted-foreground" />}
                            {rule.channels.includes('sms') && <Smartphone className="h-3 w-3 text-muted-foreground" />}
                            {rule.channels.includes('in_app') && <Bell className="h-3 w-3 text-muted-foreground" />}
                            {rule.threshold && (
                              <span className="text-xs text-muted-foreground ml-2">
                                Threshold: {rule.threshold}{rule.metricId.includes('spike') ? '%' : ' USD'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={() => toggleRule(rule.id)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categories Overview */}
      <Card className="bg-card/50 backdrop-blur-sm border-card-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Notification Categories
          </CardTitle>
          <CardDescription>
            Overview of all available notification types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {notificationCategories.map((category) => {
              const Icon = category.icon;
              const categoryRules = rules.filter(r => r.categoryId === category.id);
              const activeCount = categoryRules.filter(r => r.enabled).length;

              return (
                <AccordionItem key={category.id} value={category.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", category.bgColor)}>
                        <Icon className={cn("h-4 w-4", category.color)} />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{category.name}</p>
                        <p className="text-xs text-muted-foreground">{category.description}</p>
                      </div>
                      {activeCount > 0 && (
                        <Badge variant="secondary" className="ml-auto mr-4">
                          {activeCount} active
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pl-12 space-y-2">
                      {category.metrics.map((metric) => {
                        const existingRule = rules.find(
                          r => r.categoryId === category.id && r.metricId === metric.id
                        );

                        return (
                          <div
                            key={metric.id}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-lg",
                              existingRule ? "bg-primary/5" : "hover:bg-muted/50"
                            )}
                          >
                            <div>
                              <p className="text-sm font-medium">{metric.name}</p>
                              <p className="text-xs text-muted-foreground">{metric.desc}</p>
                            </div>
                            {existingRule ? (
                              <Badge variant={existingRule.enabled ? "default" : "secondary"}>
                                {existingRule.enabled ? "Active" : "Disabled"}
                              </Badge>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => {
                                  setNewRule({
                                    ...newRule,
                                    categoryId: category.id,
                                    metricId: metric.id,
                                  });
                                  setIsAddDialogOpen(true);
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
