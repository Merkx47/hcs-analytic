import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFinOpsStore, formatCurrency, formatCompactCurrency } from '@/lib/finops-store';
import { useDataStore } from '@/lib/data-store';
import { useLocation, useRoute } from 'wouter';
import {
  Building2,
  ArrowLeft,
  Server,
  Layers,
  Box,
  Database,
  Wallet,
  TrendingUp,
  TrendingDown,
  Zap,
  ChevronDown,
  Globe,
  Mail,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

// VDC type styling - using consistent primary/muted theme colors for tree
// Chart colors are separate for better visibility
const vdcConfig = {
  vdc1: { bg: 'bg-primary/5 dark:bg-primary/10', border: 'border-primary/30 dark:border-primary/40', text: 'text-primary dark:text-primary' },
  vdc2: { bg: 'bg-muted/50 dark:bg-muted/30', border: 'border-border', text: 'text-foreground' },
  vdc3: { bg: 'bg-muted/30 dark:bg-muted/20', border: 'border-border/70', text: 'text-foreground/90' },
  vdc4: { bg: 'bg-muted/20 dark:bg-muted/15', border: 'border-border/50', text: 'text-foreground/80' },
  vdc5: { bg: 'bg-muted/10 dark:bg-muted/10', border: 'border-border/30', text: 'text-foreground/70' },
};

// Distinct colors for charts - clear differentiation between VDC levels
const chartColors = {
  vdc1: '#DC2626', // Red-600
  vdc2: '#2563EB', // Blue-600
  vdc3: '#16A34A', // Green-600
  vdc4: '#D97706', // Amber-600
  vdc5: '#7C3AED', // Violet-600
};

// VDC hierarchy structure for a tenant
interface VDCNode {
  id: string;
  name: string;
  level: keyof typeof vdcConfig;
  spend: number;
  budget: number;
  resources: number;
  trend: number;
  children?: VDCNode[];
}

// Generate mock VDC hierarchy for a tenant with accurate math
// Children spend/resources must sum to parent values
const generateVDCHierarchy = (tenantId: string, tenantBudget: number): VDCNode => {
  const l1Budget = tenantBudget;
  const l1Spend = l1Budget * (0.7 + Math.random() * 0.2);
  const l1Resources = 150;

  // L2 divisions - must sum to L1
  const itDivisionPct = 0.45;
  const operationsPct = 0.35;
  const financePct = 0.20; // 0.45 + 0.35 + 0.20 = 1.0

  const itSpend = l1Spend * itDivisionPct;
  const itResources = Math.floor(l1Resources * itDivisionPct);

  const opsSpend = l1Spend * operationsPct;
  const opsResources = Math.floor(l1Resources * operationsPct);

  const finSpend = l1Spend * financePct;
  const finResources = l1Resources - itResources - opsResources; // Remainder

  // L3 under IT Division - must sum to IT
  const infraPct = 0.55;
  const devPct = 0.45; // 0.55 + 0.45 = 1.0

  const infraSpend = itSpend * infraPct;
  const infraResources = Math.floor(itResources * infraPct);

  const devSpend = itSpend * devPct;
  const devResources = itResources - infraResources; // Remainder

  // L4 under Infrastructure - must sum to Infrastructure
  const networkPct = 0.55;
  const storagePct = 0.45; // 0.55 + 0.45 = 1.0

  const networkSpend = infraSpend * networkPct;
  const networkResources = Math.floor(infraResources * networkPct);

  const storageSpend = infraSpend * storagePct;
  const storageResources = infraResources - networkResources; // Remainder

  // L3 under Operations - Production is the only child (100%)
  const prodSpend = opsSpend;
  const prodResources = opsResources;

  return {
    id: `${tenantId}-vdc1`,
    name: 'Enterprise VDC',
    level: 'vdc1',
    spend: l1Spend,
    budget: l1Budget,
    resources: l1Resources,
    trend: Math.random() > 0.5 ? Math.random() * 15 : -Math.random() * 10,
    children: [
      {
        id: `${tenantId}-vdc2-1`,
        name: 'IT Division',
        level: 'vdc2',
        spend: itSpend,
        budget: l1Budget * itDivisionPct,
        resources: itResources,
        trend: Math.random() > 0.5 ? Math.random() * 12 : -Math.random() * 8,
        children: [
          {
            id: `${tenantId}-vdc3-1`,
            name: 'Infrastructure',
            level: 'vdc3',
            spend: infraSpend,
            budget: l1Budget * itDivisionPct * infraPct,
            resources: infraResources,
            trend: Math.random() > 0.5 ? Math.random() * 10 : -Math.random() * 5,
            children: [
              {
                id: `${tenantId}-vdc4-1`,
                name: 'Network Team',
                level: 'vdc4',
                spend: networkSpend,
                budget: l1Budget * itDivisionPct * infraPct * networkPct,
                resources: networkResources,
                trend: Math.random() > 0.5 ? Math.random() * 8 : -Math.random() * 4,
              },
              {
                id: `${tenantId}-vdc4-2`,
                name: 'Storage Team',
                level: 'vdc4',
                spend: storageSpend,
                budget: l1Budget * itDivisionPct * infraPct * storagePct,
                resources: storageResources,
                trend: Math.random() > 0.5 ? Math.random() * 8 : -Math.random() * 4,
              },
            ],
          },
          {
            id: `${tenantId}-vdc3-2`,
            name: 'Development',
            level: 'vdc3',
            spend: devSpend,
            budget: l1Budget * itDivisionPct * devPct,
            resources: devResources,
            trend: Math.random() > 0.5 ? Math.random() * 10 : -Math.random() * 5,
          },
        ],
      },
      {
        id: `${tenantId}-vdc2-2`,
        name: 'Operations',
        level: 'vdc2',
        spend: opsSpend,
        budget: l1Budget * operationsPct,
        resources: opsResources,
        trend: Math.random() > 0.5 ? Math.random() * 12 : -Math.random() * 8,
        children: [
          {
            id: `${tenantId}-vdc3-3`,
            name: 'Production',
            level: 'vdc3',
            spend: prodSpend,
            budget: l1Budget * operationsPct,
            resources: prodResources,
            trend: Math.random() > 0.5 ? Math.random() * 10 : -Math.random() * 5,
          },
        ],
      },
      {
        id: `${tenantId}-vdc2-3`,
        name: 'Finance',
        level: 'vdc2',
        spend: finSpend,
        budget: l1Budget * financePct,
        resources: finResources,
        trend: Math.random() > 0.5 ? Math.random() * 12 : -Math.random() * 8,
      },
    ],
  };
};

// Flatten VDC tree for chart data
const flattenVDCs = (node: VDCNode, result: VDCNode[] = []): VDCNode[] => {
  result.push(node);
  if (node.children) {
    node.children.forEach(child => flattenVDCs(child, result));
  }
  return result;
};

// VDC Tree Node Component
function VDCTreeNode({
  node,
  depth = 0,
  currency,
}: {
  node: VDCNode;
  depth?: number;
  currency: string;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const config = vdcConfig[node.level];
  const hasChildren = node.children && node.children.length > 0;

  const levelLabels: Record<string, string> = {
    vdc1: 'L1 - Enterprise',
    vdc2: 'L2 - Division',
    vdc3: 'L3 - Department',
    vdc4: 'L4 - Team',
    vdc5: 'L5 - Project',
  };

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          "p-3 rounded-lg border cursor-pointer transition-all",
          config.border,
          config.bg,
          "hover:shadow-md"
        )}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <Layers className={cn("h-4 w-4 mt-0.5", config.text)} />
            <div>
              <div className="flex items-center gap-2">
                <h4 className={cn("font-medium text-sm", config.text)}>{node.name}</h4>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                  {levelLabels[node.level]}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Wallet className="h-3 w-3" />
                  {formatCompactCurrency(node.spend, currency as any)}
                </span>
                <span className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  {node.resources} resources
                </span>
              </div>
            </div>
          </div>

          {hasChildren && (
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform text-muted-foreground",
              expanded && "rotate-180"
            )} />
          )}
        </div>

      </motion.div>

      {/* Children */}
      <AnimatePresence>
        {hasChildren && expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-6 mt-2 space-y-2 pl-4 border-l-2 border-dashed border-muted-foreground/30"
          >
            {node.children?.map((child) => (
              <VDCTreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                currency={currency}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TenantDetail() {
  const [, params] = useRoute('/tenant/:id');
  const [, setLocation] = useLocation();
  const { currency } = useFinOpsStore();
  const { tenants } = useDataStore();

  const tenantId = params?.id;
  const tenant = tenants.find(t => t.id === tenantId);

  const vdcHierarchy = useMemo(() => {
    if (!tenant) return null;
    return generateVDCHierarchy(tenant.id, tenant.budget);
  }, [tenant]);

  const allVDCs = useMemo(() => {
    if (!vdcHierarchy) return [];
    return flattenVDCs(vdcHierarchy);
  }, [vdcHierarchy]);

  // Chart data - only count leaf nodes (VDCs without children) to avoid double-counting
  const spendByLevel = useMemo(() => {
    const levelSpend: Record<string, number> = {};
    // Only count VDCs that don't have children (leaf nodes)
    const leafVDCs = allVDCs.filter(vdc => !vdc.children || vdc.children.length === 0);
    leafVDCs.forEach(vdc => {
      const levelName = vdc.level.toUpperCase().replace('VDC', 'VDC L');
      levelSpend[levelName] = (levelSpend[levelName] || 0) + vdc.spend;
    });
    return Object.entries(levelSpend).map(([name, value]) => ({ name, value }));
  }, [allVDCs]);

  const vdcSpendData = useMemo(() => {
    return allVDCs.slice(0, 8).map(vdc => ({
      name: vdc.name,
      spend: vdc.spend,
      budget: vdc.budget,
      level: vdc.level,
    }));
  }, [allVDCs]);

  if (!tenant || !vdcHierarchy) {
    return (
      <ScrollArea className="h-full">
        <div className="p-6 text-center">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Tenant Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested tenant could not be found.</p>
          <Button onClick={() => setLocation('/tenants')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tenants
          </Button>
        </div>
      </ScrollArea>
    );
  }

  const totalSpend = vdcHierarchy.spend;
  const budgetUsage = (totalSpend / tenant.budget) * 100;

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-[1920px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => setLocation('/tenants')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tenants
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{tenant.name}</h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <span>{tenant.industry}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" />
                    {tenant.country}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {tenant.contactEmail}
                  </span>
                </div>
              </div>
            </div>
            <Badge
              variant={tenant.status === 'active' ? 'default' : 'secondary'}
              className="text-sm"
            >
              {tenant.status}
            </Badge>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: 'Total Spend',
              value: formatCurrency(totalSpend, currency as any),
              icon: Wallet,
              color: 'text-emerald-500',
              bgColor: 'bg-emerald-500/10',
            },
            {
              label: 'Budget Usage',
              value: `${budgetUsage.toFixed(1)}%`,
              icon: BarChart3,
              color: budgetUsage > 90 ? 'text-red-500' : budgetUsage > 70 ? 'text-amber-500' : 'text-emerald-500',
              bgColor: budgetUsage > 90 ? 'bg-red-500/10' : budgetUsage > 70 ? 'bg-amber-500/10' : 'bg-emerald-500/10',
            },
            {
              label: 'Efficiency Score',
              value: `${tenant.efficiencyScore}%`,
              icon: Zap,
              color: 'text-amber-500',
              bgColor: 'bg-amber-500/10',
            },
            {
              label: 'Total VDCs',
              value: allVDCs.length,
              icon: Layers,
              color: 'text-blue-500',
              bgColor: 'bg-blue-500/10',
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-xl font-bold font-mono">{stat.value}</p>
                    </div>
                    <div className={cn("p-2.5 rounded-xl", stat.bgColor)}>
                      <stat.icon className={cn("h-5 w-5", stat.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="hierarchy" className="space-y-6">
          <TabsList>
            <TabsTrigger value="hierarchy">VDC Hierarchy</TabsTrigger>
            <TabsTrigger value="spending">Spending Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="hierarchy">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    VDC Organogram
                  </CardTitle>
                  <CardDescription>
                    Hierarchical view of Virtual Data Centers and their spending
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Legend */}
                  <div className="flex flex-wrap gap-3 mb-6 p-3 rounded-lg bg-muted/30">
                    {Object.entries(vdcConfig).map(([level, config]) => (
                      <div key={level} className="flex items-center gap-1.5">
                        <div className={cn("w-3 h-3 rounded", config.bg, config.border, "border")} />
                        <span className="text-xs text-muted-foreground">
                          {level.toUpperCase().replace('VDC', 'VDC L')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* VDC Tree */}
                  <div className="space-y-3">
                    <VDCTreeNode node={vdcHierarchy} currency={currency} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="spending">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Spend by VDC Level */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                  <CardHeader>
                    <CardTitle className="text-base">Spend by VDC Level</CardTitle>
                    <CardDescription>Distribution of costs across VDC levels</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={spendByLevel}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {spendByLevel.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={Object.values(chartColors)[index % Object.values(chartColors).length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => formatCurrency(value, currency as any)}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* VDC Spend Comparison */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                  <CardHeader>
                    <CardTitle className="text-base">VDC Spend vs Budget</CardTitle>
                    <CardDescription>Spending comparison across VDCs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={vdcSpendData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis
                            type="number"
                            tickFormatter={(value) => formatCompactCurrency(value, currency as any)}
                            className="text-xs"
                          />
                          <YAxis
                            dataKey="name"
                            type="category"
                            width={100}
                            className="text-xs"
                          />
                          <Tooltip
                            formatter={(value: number) => formatCurrency(value, currency as any)}
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              borderColor: 'hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                          />
                          <Bar dataKey="spend" name="Spend" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                          <Bar dataKey="budget" name="Budget" fill="#6B7280" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* VDC List */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2"
              >
                <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                  <CardHeader>
                    <CardTitle className="text-base">All VDCs</CardTitle>
                    <CardDescription>Complete list of Virtual Data Centers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 font-medium">VDC Name</th>
                            <th className="text-left py-3 px-4 font-medium">Level</th>
                            <th className="text-right py-3 px-4 font-medium">Spend</th>
                            <th className="text-right py-3 px-4 font-medium">Budget</th>
                            <th className="text-right py-3 px-4 font-medium">Usage</th>
                            <th className="text-right py-3 px-4 font-medium">Resources</th>
                            <th className="text-right py-3 px-4 font-medium">Trend</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allVDCs.map((vdc) => {
                            const config = vdcConfig[vdc.level];
                            const usage = (vdc.spend / vdc.budget) * 100;

                            return (
                              <tr key={vdc.id} className="border-b border-border/50 hover:bg-muted/30">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <div className={cn("w-2 h-2 rounded-full", config.bg, config.border, "border")} />
                                    <span className="font-medium">{vdc.name}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <Badge variant="outline" className={cn("text-xs", config.text)}>
                                    {vdc.level.toUpperCase()}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 text-right font-mono">
                                  {formatCompactCurrency(vdc.spend, currency as any)}
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                                  {formatCompactCurrency(vdc.budget, currency as any)}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <span className={cn(
                                    "font-medium font-mono inline-block w-[40px]",
                                    usage > 90 ? "text-red-500" :
                                    usage > 70 ? "text-amber-500" : "text-emerald-500"
                                  )}>
                                    {usage.toFixed(0)}%
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right font-mono">
                                  {vdc.resources}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <span className={cn(
                                    "inline-flex items-center justify-end gap-1 text-xs font-medium w-[60px]",
                                    vdc.trend >= 0 ? "text-red-500" : "text-emerald-500"
                                  )}>
                                    {vdc.trend >= 0 ? (
                                      <TrendingUp className="h-3 w-3 flex-shrink-0" />
                                    ) : (
                                      <TrendingDown className="h-3 w-3 flex-shrink-0" />
                                    )}
                                    <span className="font-mono w-[36px] text-right">{Math.abs(vdc.trend).toFixed(1)}%</span>
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}
