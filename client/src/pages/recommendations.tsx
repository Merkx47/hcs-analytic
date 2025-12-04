import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useFinOpsStore, formatCurrency, formatCompactCurrency } from '@/lib/finops-store';
import { useDataStore } from '@/lib/data-store';
import { serviceInfo, type RecommendationType, type RecommendationImpact, type Recommendation } from '@shared/schema';
import { useMemo, useState } from 'react';
import {
  Lightbulb,
  TrendingDown,
  Server,
  Database,
  HardDrive,
  Network,
  Gauge,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Zap,
  Target,
  X,
  Check,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const typeIcons: Record<RecommendationType, typeof Server> = {
  rightsizing: Gauge,
  idle_resource: Server,
  reserved_instance: Database,
  storage_optimization: HardDrive,
  network_optimization: Network,
  database_tuning: Database,
};

const typeLabels: Record<RecommendationType, string> = {
  rightsizing: 'Rightsizing',
  idle_resource: 'Idle Resource',
  reserved_instance: 'Reserved Instance',
  storage_optimization: 'Storage Optimization',
  network_optimization: 'Network Optimization',
  database_tuning: 'Database Tuning',
};

const impactColors: Record<RecommendationImpact, { bg: string; text: string; border: string }> = {
  high: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
  low: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
};

const statusInfo = {
  new: { icon: AlertTriangle, label: 'New', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  in_progress: { icon: Clock, label: 'In Progress', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  implemented: { icon: CheckCircle2, label: 'Implemented', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  dismissed: { icon: X, label: 'Dismissed', color: 'text-muted-foreground', bg: 'bg-muted/50' },
};

export default function Recommendations() {
  const { currency, selectedTenantId } = useFinOpsStore();
  const { recommendations, implementRecommendation, dismissRecommendation, implementEasyWins } = useDataStore();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [impactFilter, setImpactFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('new');
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [showEasyWinsDialog, setShowEasyWinsDialog] = useState(false);

  const filteredByTenant = useMemo(() => {
    if (selectedTenantId === 'all') return recommendations;
    return recommendations.filter(r => r.tenantId === selectedTenantId);
  }, [recommendations, selectedTenantId]);

  const filteredRecommendations = useMemo(() => {
    return filteredByTenant.filter(r => {
      const matchesType = typeFilter === 'all' || r.type === typeFilter;
      const matchesImpact = impactFilter === 'all' || r.impact === impactFilter;
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesType && matchesImpact && matchesStatus;
    });
  }, [filteredByTenant, typeFilter, impactFilter, statusFilter]);

  const stats = useMemo(() => {
    const newCount = filteredByTenant.filter(r => r.status === 'new').length;
    const totalSavings = filteredByTenant.filter(r => r.status === 'new').reduce((sum, r) => sum + r.projectedSavings, 0);
    const highImpact = filteredByTenant.filter(r => r.impact === 'high' && r.status === 'new').length;
    const easyWins = filteredByTenant.filter(r => r.effort === 'easy' && r.status === 'new').length;
    const implemented = filteredByTenant.filter(r => r.status === 'implemented').length;
    return { newCount, totalSavings, highImpact, easyWins, implemented };
  }, [filteredByTenant]);

  const easyWinsData = useMemo(() => {
    const easyWins = filteredByTenant.filter(r => r.effort === 'easy' && r.status === 'new');
    const totalSavings = easyWins.reduce((sum, r) => sum + r.projectedSavings, 0);
    return { count: easyWins.length, savings: totalSavings };
  }, [filteredByTenant]);

  const byType = filteredByTenant.reduce((acc, r) => {
    if (!acc[r.type]) acc[r.type] = { count: 0, savings: 0 };
    acc[r.type].count++;
    if (r.status === 'new') acc[r.type].savings += r.projectedSavings;
    return acc;
  }, {} as Record<RecommendationType, { count: number; savings: number }>);

  const handleImplementEasyWins = () => {
    implementEasyWins();
    setShowEasyWinsDialog(false);
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-[1920px] mx-auto" data-testid="recommendations-page">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between gap-4 mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cost Optimization</h1>
            <p className="text-sm text-muted-foreground mt-1">
              AI-powered recommendations to reduce your cloud spend
            </p>
          </div>
          <AlertDialog open={showEasyWinsDialog} onOpenChange={setShowEasyWinsDialog}>
            <Button
              className="bg-primary hover:bg-primary/90"
              data-testid="button-implement-all"
              onClick={() => setShowEasyWinsDialog(true)}
              disabled={easyWinsData.count === 0}
            >
              <Zap className="h-4 w-4 mr-2" />
              Implement Easy Wins ({easyWinsData.count})
            </Button>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Implement Easy Wins</AlertDialogTitle>
                <AlertDialogDescription>
                  This will implement {easyWinsData.count} easy recommendations, saving approximately {formatCurrency(easyWinsData.savings, currency)} per month. Are you sure you want to proceed?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleImplementEasyWins}>
                  <Check className="h-4 w-4 mr-2" />
                  Implement All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'New', value: stats.newCount, icon: Lightbulb, color: 'text-amber-500' },
            { label: 'Potential Savings', value: formatCurrency(stats.totalSavings, currency), icon: TrendingDown, color: 'text-emerald-500', isValue: true },
            { label: 'High Impact', value: stats.highImpact, icon: Target, color: 'text-primary' },
            { label: 'Easy Wins', value: stats.easyWins, icon: Zap, color: 'text-blue-500' },
            { label: 'Implemented', value: stats.implemented, icon: CheckCircle2, color: 'text-emerald-500' },
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
                        stat.isValue ? "text-lg" : "text-2xl"
                      )}>{stat.value}</p>
                    </div>
                    <div className={cn("p-2.5 rounded-xl", stat.color === 'text-emerald-500' ? 'bg-emerald-500/10' : stat.color === 'text-amber-500' ? 'bg-amber-500/10' : stat.color === 'text-blue-500' ? 'bg-blue-500/10' : 'bg-primary/10')}>
                      <stat.icon className={cn("h-6 w-6", stat.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <Card className="bg-card/50 backdrop-blur-sm border-card-border sticky top-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">By Category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(Object.entries(byType) as [RecommendationType, { count: number; savings: number }][]).map(([type, data]) => {
                  const Icon = typeIcons[type];
                  return (
                    <div
                      key={type}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer hover-elevate",
                        typeFilter === type ? "bg-primary/10 border-primary" : "border-border"
                      )}
                      onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{typeLabels[type]}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">{data.count}</Badge>
                      </div>
                      <p className="text-sm font-mono text-emerald-500">
                        {formatCompactCurrency(data.savings, currency)} potential
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="lg:col-span-3"
          >
            <Card className="bg-card/50 backdrop-blur-sm border-card-border">
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    Recommendations
                    <Badge variant="secondary" className="ml-2">{filteredRecommendations.length}</Badge>
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="implemented">Implemented</SelectItem>
                        <SelectItem value="dismissed">Dismissed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={impactFilter} onValueChange={setImpactFilter}>
                      <SelectTrigger className="w-[130px]" data-testid="select-impact-filter">
                        <SelectValue placeholder="Impact" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Impact</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setTypeFilter('all'); setImpactFilter('all'); setStatusFilter('new'); }}
                    >
                      Clear filters
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredRecommendations.map((rec, index) => {
                  const Icon = typeIcons[rec.type];
                  const StatusIcon = statusInfo[rec.status].icon;
                  const impact = impactColors[rec.impact];
                  const status = statusInfo[rec.status];

                  return (
                    <motion.div
                      key={rec.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.05 * index }}
                    >
                      <div
                        className={cn(
                          "p-4 rounded-lg border bg-background/50 hover-elevate",
                          rec.status === 'implemented' && "opacity-70",
                          rec.status === 'dismissed' && "opacity-50"
                        )}
                        data-testid={`recommendation-${rec.id}`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className="p-3 rounded-xl flex-shrink-0"
                            style={{ backgroundColor: `${serviceInfo[rec.service]?.color}15` }}
                          >
                            <Icon
                              className="h-5 w-5"
                              style={{ color: serviceInfo[rec.service]?.color }}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div>
                                <h3 className="text-base font-semibold">{rec.title}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                    style={{
                                      backgroundColor: `${serviceInfo[rec.service]?.color}20`,
                                      color: serviceInfo[rec.service]?.color,
                                    }}
                                  >
                                    {rec.service}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">{rec.resourceName}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge
                                  variant="outline"
                                  className={cn("text-xs", status.bg, status.color)}
                                >
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {status.label}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={cn("text-xs border", impact.bg, impact.text, impact.border)}
                                >
                                  {rec.impact.toUpperCase()} IMPACT
                                </Badge>
                              </div>
                            </div>

                            <p className="text-sm text-muted-foreground mb-4">
                              {rec.description}
                            </p>

                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div>
                                  <p className="text-xs text-muted-foreground">Current Cost</p>
                                  <p className="text-sm font-mono">{formatCurrency(rec.currentCost, currency)}/mo</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Effort</p>
                                  <Badge variant="secondary" className="text-xs capitalize">{rec.effort}</Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground">Potential Savings</p>
                                  <div className="flex items-center gap-1 text-emerald-500">
                                    <TrendingDown className="h-4 w-4" />
                                    <span className="text-lg font-mono font-bold">
                                      {formatCurrency(rec.projectedSavings, currency)}
                                    </span>
                                    <span className="text-xs">/mo</span>
                                  </div>
                                </div>
                                {rec.status === 'new' && (
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => dismissRecommendation(rec.id)}
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      Dismiss
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="bg-primary hover:bg-primary/90"
                                      onClick={() => setSelectedRec(rec)}
                                    >
                                      View Details
                                      <ArrowUpRight className="h-4 w-4 ml-1" />
                                    </Button>
                                  </div>
                                )}
                                {rec.status === 'implemented' && (
                                  <Badge className="bg-emerald-500/10 text-emerald-500">
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    Saving {formatCurrency(rec.projectedSavings, currency)}/mo
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {filteredRecommendations.length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Recommendations Found</h3>
                    <p className="text-sm text-muted-foreground">
                      {typeFilter !== 'all' || impactFilter !== 'all' || statusFilter !== 'new'
                        ? 'Try adjusting your filters to see more recommendations.'
                        : 'Great job! Your cloud resources are well optimized.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Details Dialog */}
        <Dialog open={!!selectedRec} onOpenChange={(open) => !open && setSelectedRec(null)}>
          <DialogContent className="sm:max-w-[600px]">
            {selectedRec && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedRec.title}</DialogTitle>
                  <DialogDescription>
                    Review and implement this optimization recommendation
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: `${serviceInfo[selectedRec.service]?.color}20`,
                        color: serviceInfo[selectedRec.service]?.color,
                      }}
                    >
                      {selectedRec.service}
                    </Badge>
                    <Badge variant="outline" className={cn(impactColors[selectedRec.impact].bg, impactColors[selectedRec.impact].text)}>
                      {selectedRec.impact.toUpperCase()} IMPACT
                    </Badge>
                    <Badge variant="secondary" className="capitalize">{selectedRec.effort} effort</Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {selectedRec.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Resource</p>
                      <p className="font-medium">{selectedRec.resourceName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Resource ID</p>
                      <p className="font-mono text-sm">{selectedRec.resourceId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Current Monthly Cost</p>
                      <p className="font-mono font-medium">{formatCurrency(selectedRec.currentCost, currency)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Projected Savings</p>
                      <p className="font-mono font-medium text-emerald-500">{formatCurrency(selectedRec.projectedSavings, currency)}/mo</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-emerald-500" />
                      Annual Savings Projection
                    </h4>
                    <p className="text-2xl font-mono font-bold text-emerald-500">
                      {formatCurrency(selectedRec.projectedSavings * 12, currency)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Based on current usage patterns
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedRec(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      dismissRecommendation(selectedRec.id);
                      setSelectedRec(null);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Dismiss
                  </Button>
                  <Button
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => {
                      implementRecommendation(selectedRec.id);
                      setSelectedRec(null);
                    }}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Implement
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  );
}
