import { MdAccountBalanceWallet, MdDoneAll, MdInfoOutline, MdLightbulb, MdNotifications, MdNotificationsActive, MdReportProblem, MdSavings, MdTrendingUp, MdWarning } from 'react-icons/md';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDataStore, type NotificationCategory, type NotificationSeverity } from '@/lib/data-store';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

type ReadFilter = 'all' | 'unread' | 'read';
type CategoryFilter = 'all' | NotificationCategory;

const categoryIcons: Record<NotificationCategory, typeof MdNotifications> = {
  budget: MdAccountBalanceWallet,
  cost: MdTrendingUp,
  optimization: MdLightbulb,
  savings: MdSavings,
};

const categoryLabels: Record<NotificationCategory, string> = {
  budget: 'Budget',
  cost: 'Cost',
  optimization: 'Optimization',
  savings: 'Savings',
};

const categoryColors: Record<NotificationCategory, string> = {
  budget: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  cost: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  optimization: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  savings: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
};

const severityConfig: Record<NotificationSeverity, { label: string; className: string; icon: typeof MdNotifications }> = {
  critical: { label: 'Critical', className: 'bg-red-500/10 text-red-500 border-red-500/20', icon: MdReportProblem },
  warning: { label: 'Warning', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: MdWarning },
  info: { label: 'Info', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: MdInfoOutline },
};

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) === 1 ? '' : 's'} ago`;
}

export default function Notifications() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useDataStore();
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const stats = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter((n) => !n.isRead).length;
    const critical = notifications.filter((n) => n.severity === 'critical').length;
    const warnings = notifications.filter((n) => n.severity === 'warning').length;
    return { total, unread, critical, warnings };
  }, [notifications]);

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const filteredNotifications = useMemo(() => {
    return notifications
      .filter((n) => {
        if (readFilter === 'unread' && n.isRead) return false;
        if (readFilter === 'read' && !n.isRead) return false;
        if (categoryFilter !== 'all' && n.category !== categoryFilter) return false;
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [notifications, readFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE));
  const paginatedNotifications = filteredNotifications.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const kpiCards = [
    { label: 'Total Notifications', value: stats.total, icon: MdNotifications, color: 'text-foreground' },
    { label: 'Unread', value: stats.unread, icon: MdNotificationsActive, color: 'text-blue-500' },
    { label: 'Critical', value: stats.critical, icon: MdReportProblem, color: 'text-red-500' },
    { label: 'Warnings', value: stats.warnings, icon: MdWarning, color: 'text-amber-500' },
  ];

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <MdNotifications className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Notifications</h1>
              <p className="text-sm text-muted-foreground">Stay informed about budget alerts, anomalies, and optimization opportunities</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={markAllNotificationsRead}
            disabled={stats.unread === 0}
            className="gap-2"
            data-testid="mark-all-read"
          >
            <MdDoneAll className="h-4 w-4" />
            Mark All as Read
          </Button>
        </div>

        {/* KPI Cards - #175, #176, #177, #178 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {kpi.label}
                      </p>
                      <p className={cn('text-3xl font-bold mt-1', kpi.color)}>
                        {kpi.value}
                      </p>
                    </div>
                    <div className={cn('p-3 rounded-lg bg-muted/50', kpi.color)}>
                      <kpi.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filter Bar - #192, #193, #194 */}
        <Card className="bg-card/50 backdrop-blur-sm border-card-border">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <Select value={readFilter} onValueChange={(v) => { setReadFilter(v as ReadFilter); setPage(1); }}>
                <SelectTrigger className="w-[150px]" data-testid="read-status-filter">
                  <SelectValue placeholder="Read status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v as CategoryFilter); setPage(1); }}>
                <SelectTrigger className="w-[170px]" data-testid="category-filter">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="cost">Cost</SelectItem>
                  <SelectItem value="optimization">Optimization</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                </SelectContent>
              </Select>

              <span className="text-sm text-muted-foreground ml-auto" data-testid="notification-count-label">
                Showing {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, filteredNotifications.length)} of {filteredNotifications.length} notifications
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Notification Feed - #179-#191, #196 */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <Card className="bg-card/50 backdrop-blur-sm border-card-border">
              <CardContent className="p-12 text-center">
                <MdNotifications className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">No notifications match your filters.</p>
              </CardContent>
            </Card>
          ) : (
            paginatedNotifications.map((notification, i) => {
              const CategoryIcon = categoryIcons[notification.category];
              const severity = severityConfig[notification.severity];

              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card
                    className={cn(
                      'bg-card/50 backdrop-blur-sm border-card-border transition-colors cursor-pointer hover:bg-card/80',
                      notification.isRead && 'opacity-60'
                    )}
                    onClick={() => {
                      if (!notification.isRead) {
                        markNotificationRead(notification.id);
                      }
                    }}
                    data-testid={`notification-${notification.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
{/* Category icon */}
                        <div className={cn('flex-shrink-0 p-2 rounded-lg', categoryColors[notification.category])}>
                          <CategoryIcon className="h-4 w-4" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              {/* Title - #179, #182 */}
                              <h3 className={cn(
                                'text-sm leading-tight flex items-center gap-1.5',
                                !notification.isRead ? 'font-semibold' : 'font-medium text-muted-foreground'
                              )}>
                                {!notification.isRead && (
                                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                                )}
                                {notification.title}
                              </h3>
                              {/* Detail message - #180 */}
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                            </div>

                            {/* Timestamp - #183 */}
                            <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                              {formatRelativeTime(notification.timestamp)}
                            </span>
                          </div>

                          {/* Badges row */}
                          <div className="flex items-center gap-2 mt-2">
                            {/* Category tag - #181 */}
                            <Badge
                              variant="outline"
                              className={cn('text-[10px] px-1.5 py-0', categoryColors[notification.category])}
                            >
                              {categoryLabels[notification.category]}
                            </Badge>

                            {/* Severity badge - #189, #190, #191 */}
                            <Badge
                              variant="outline"
                              className={cn('text-[10px] px-1.5 py-0', severity.className)}
                            >
                              {severity.label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1]) > 1) acc.push('ellipsis');
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span key={`e-${idx}`} className="px-2 text-muted-foreground">...</span>
                  ) : (
                    <Button
                      key={item}
                      variant={page === item ? 'default' : 'outline'}
                      size="sm"
                      className="w-8"
                      onClick={() => setPage(item as number)}
                    >
                      {item}
                    </Button>
                  )
                )}
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
