import { MdAccessTime, MdAdd, MdAttachFile, MdBarChart, MdChat, MdCheckCircle, MdChevronRight, MdClose, MdContentCopy, MdDescription, MdDownload, MdErrorOutline, MdFilterList, MdFlashOn, MdHeadsetMic, MdImage, MdMic, MdMicOff, MdMoreVert, MdOpenInNew, MdPerson, MdPhone, MdPhoneDisabled, MdPhoneInTalk, MdSearch, MdSend, MdShield, MdStar, MdSync, MdThumbDown, MdThumbUp, MdVolumeOff, MdVolumeUp, MdWarning } from 'react-icons/md';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

// =====================================================
// Types
// =====================================================

type TicketPriority = 'critical' | 'high' | 'medium' | 'low';
type TicketStatus = 'open' | 'in_progress' | 'waiting_on_customer' | 'resolved' | 'closed';
type TicketCategory = 'billing' | 'technical' | 'access' | 'performance' | 'security' | 'general';

interface TicketMessage {
  id: string;
  sender: 'customer' | 'agent' | 'system';
  senderName: string;
  message: string;
  timestamp: string;
  attachments?: string[];
}

interface Ticket {
  id: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignee: string;
  assigneeAvatar: string;
  createdAt: string;
  updatedAt: string;
  sla: { target: number; elapsed: number };
  messages: TicketMessage[];
  satisfaction?: number;
}

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string; // object URL for preview
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'bot';
  senderName: string;
  message: string;
  timestamp: Date;
  typing?: boolean;
  attachments?: FileAttachment[];
}

// =====================================================
// Mock Data
// =====================================================

const AGENTS = [
  { name: 'Amara Okafor', initials: 'AO', role: 'Senior Support Engineer', speciality: 'Billing & Accounts' },
  { name: 'Chen Wei', initials: 'CW', role: 'Cloud Architect', speciality: 'Technical Infrastructure' },
  { name: 'Fatima Al-Rashid', initials: 'FR', role: 'Security Specialist', speciality: 'IAM & Compliance' },
  { name: 'David Mensah', initials: 'DM', role: 'Platform Engineer', speciality: 'Performance & Scaling' },
  { name: 'Priya Sharma', initials: 'PS', role: 'Support Lead', speciality: 'General & Escalations' },
];

const CATEGORIES: { value: TicketCategory; label: string; icon: typeof MdHeadsetMic }[] = [
  { value: 'billing', label: 'Billing & Invoices', icon: MdDescription },
  { value: 'technical', label: 'Technical Issue', icon: MdFlashOn },
  { value: 'access', label: 'Access & IAM', icon: MdShield },
  { value: 'performance', label: 'Performance', icon: MdBarChart },
  { value: 'security', label: 'Security', icon: MdShield },
  { value: 'general', label: 'General Inquiry', icon: MdChat },
];

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; color: string; badge: string; slaHours: number }> = {
  critical: { label: 'Critical', color: 'text-red-500', badge: 'bg-red-500/10 text-red-600 border-red-200', slaHours: 1 },
  high: { label: 'High', color: 'text-orange-500', badge: 'bg-orange-500/10 text-orange-600 border-orange-200', slaHours: 4 },
  medium: { label: 'Medium', color: 'text-amber-500', badge: 'bg-amber-500/10 text-amber-600 border-amber-200', slaHours: 12 },
  low: { label: 'Low', color: 'text-blue-500', badge: 'bg-blue-500/10 text-blue-600 border-blue-200', slaHours: 48 },
};

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; icon: typeof MdCheckCircle }> = {
  open: { label: 'Open', color: 'bg-blue-500/10 text-blue-600 border-blue-200', icon: MdErrorOutline },
  in_progress: { label: 'In Progress', color: 'bg-purple-500/10 text-purple-600 border-purple-200', icon: MdSync },
  waiting_on_customer: { label: 'Waiting on You', color: 'bg-amber-500/10 text-amber-600 border-amber-200', icon: MdAccessTime },
  resolved: { label: 'Resolved', color: 'bg-green-500/10 text-green-600 border-green-200', icon: MdCheckCircle },
  closed: { label: 'Closed', color: 'bg-muted text-muted-foreground border-border', icon: MdCheckCircle },
};

function generateMockTickets(): Ticket[] {
  return [
    {
      id: 'TKT-2024-001',
      subject: 'Unexpected cost spike on ECS instances in af-south-1',
      description: 'We noticed a 340% cost increase on our production ECS cluster over the last 48 hours. No new instances were provisioned manually. Need urgent investigation.',
      category: 'billing',
      priority: 'critical',
      status: 'in_progress',
      assignee: 'Amara Okafor',
      assigneeAvatar: 'AO',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      sla: { target: 60, elapsed: 42 },
      messages: [
        { id: 'm1', sender: 'customer', senderName: 'You', message: 'We noticed a 340% cost increase on our production ECS cluster over the last 48 hours. No new instances were provisioned manually.', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
        { id: 'm2', sender: 'system', senderName: 'System', message: 'Ticket assigned to Amara Okafor (Senior Support Engineer)', timestamp: new Date(Date.now() - 115 * 60 * 1000).toISOString() },
        { id: 'm3', sender: 'agent', senderName: 'Amara Okafor', message: 'Hi, I\'m looking into this now. I can see auto-scaling triggered 12 new c6.2xlarge instances due to a CPU threshold breach. I\'m checking if this was a legitimate traffic spike or misconfigured scaling policy.', timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString() },
        { id: 'm4', sender: 'agent', senderName: 'Amara Okafor', message: 'Found it — your auto-scaling policy had the CPU threshold set to 30% instead of 70%. This caused aggressive scaling on normal traffic. I\'ve drafted a corrected policy for your review. Shall I apply it?', timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
      ],
    },
    {
      id: 'TKT-2024-002',
      subject: 'Cannot access VDC-Production after IAM policy change',
      description: 'After updating our IAM policies yesterday, 3 team members lost access to the production VDC. They get a 403 Forbidden error.',
      category: 'access',
      priority: 'high',
      status: 'waiting_on_customer',
      assignee: 'Fatima Al-Rashid',
      assigneeAvatar: 'FR',
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      sla: { target: 240, elapsed: 180 },
      messages: [
        { id: 'm5', sender: 'customer', senderName: 'You', message: 'After updating our IAM policies yesterday, 3 team members lost access to the production VDC. They get a 403 Forbidden error.', timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
        { id: 'm6', sender: 'agent', senderName: 'Fatima Al-Rashid', message: 'I can see the policy change removed the `vdc:ReadAccess` permission from the `prod-operators` group. I can restore it with a scoped policy. Can you confirm the affected user IDs?', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
      ],
    },
    {
      id: 'TKT-2024-003',
      subject: 'GaussDB read replica latency exceeds 500ms',
      description: 'Our GaussDB read replicas in cn-north-4 are showing consistent latency above 500ms for the past 6 hours.',
      category: 'performance',
      priority: 'high',
      status: 'in_progress',
      assignee: 'David Mensah',
      assigneeAvatar: 'DM',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      sla: { target: 240, elapsed: 200 },
      messages: [
        { id: 'm7', sender: 'customer', senderName: 'You', message: 'GaussDB read replicas showing >500ms latency in cn-north-4. This is impacting our API response times.', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
        { id: 'm8', sender: 'agent', senderName: 'David Mensah', message: 'I\'ve identified the issue — there\'s a replication lag due to a long-running analytical query on the primary. I\'m working with the DBA team to migrate that workload to a dedicated analytics replica.', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
      ],
    },
    {
      id: 'TKT-2024-004',
      subject: 'Request for detailed cost breakdown report by department',
      description: 'Need a monthly cost breakdown report segmented by department tags for the finance team review.',
      category: 'general',
      priority: 'low',
      status: 'resolved',
      assignee: 'Priya Sharma',
      assigneeAvatar: 'PS',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      sla: { target: 2880, elapsed: 1440 },
      satisfaction: 5,
      messages: [
        { id: 'm9', sender: 'customer', senderName: 'You', message: 'Need a monthly cost breakdown report segmented by department tags for the finance team review.', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'm10', sender: 'agent', senderName: 'Priya Sharma', message: 'I\'ve configured a scheduled report in the Reports module that runs on the 1st of each month. It breaks down costs by the `department` tag across all tenants. You can find it under Reports > Scheduled.', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'm11', sender: 'customer', senderName: 'You', message: 'Perfect, exactly what we needed. Thank you!', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
      ],
    },
    {
      id: 'TKT-2024-005',
      subject: 'Security audit: Suspicious API calls from unknown IP range',
      description: 'CTS logs show API calls from IP range 45.33.x.x which is not in our allow-list. Need security review.',
      category: 'security',
      priority: 'critical',
      status: 'resolved',
      assignee: 'Fatima Al-Rashid',
      assigneeAvatar: 'FR',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      sla: { target: 60, elapsed: 45 },
      satisfaction: 5,
      messages: [
        { id: 'm12', sender: 'customer', senderName: 'You', message: 'CTS logs show API calls from IP 45.33.x.x — not in our allow-list. Potential unauthorized access.', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'm13', sender: 'agent', senderName: 'Fatima Al-Rashid', message: 'Investigated immediately. The IP range belongs to a CI/CD pipeline from your GitHub Actions runner. I\'ve added it to the allow-list and set up an alert for any truly unknown IPs going forward. No data breach occurred.', timestamp: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000).toISOString() },
      ],
    },
    {
      id: 'TKT-2024-006',
      subject: 'OBS bucket CORS configuration not applying',
      description: 'Updated CORS rules on obs-frontend-assets bucket but changes don\'t seem to take effect. Browser still shows CORS errors.',
      category: 'technical',
      priority: 'medium',
      status: 'open',
      assignee: 'Chen Wei',
      assigneeAvatar: 'CW',
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      sla: { target: 720, elapsed: 45 },
      messages: [
        { id: 'm14', sender: 'customer', senderName: 'You', message: 'Updated CORS on obs-frontend-assets but still getting CORS errors in browser. Cleared CDN cache too.', timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
      ],
    },
  ];
}

// Agent responses based on keywords for simulating real agent chat
const AGENT_RESPONSES: Record<string, string[]> = {
  billing: [
    "Let me pull up your billing dashboard. I can see your current invoice for this billing cycle.",
    "I've reviewed your account — I can see the charges you're referring to. Let me break them down for you.",
    "I'll investigate those charges and get back to you with a detailed breakdown. Can you share the invoice ID?",
  ],
  technical: [
    "I understand the issue. Let me check the service logs on our end to see what's happening.",
    "I can see the error in our monitoring system. Let me look into the root cause for you.",
    "Can you share your resource ID or VDC name? I'll check the configuration and logs immediately.",
  ],
  performance: [
    "Let me check the performance metrics for your resources. I'll pull up the last 24 hours of data.",
    "I can see some latency spikes in your region. Let me investigate whether this is related to your issue.",
  ],
  access: [
    "I'll check your IAM policies and permissions right away. Can you tell me which user accounts are affected?",
    "Let me review the access logs for your VDC. I should be able to identify the permission issue quickly.",
  ],
  default: [
    "I understand. Let me look into that for you right away.",
    "Thanks for the details. Give me a moment while I investigate this on our end.",
    "I'm checking our systems now. Can you provide any additional details that might help me resolve this faster?",
    "I see — let me pull up your account and check what's happening. One moment please.",
  ],
};

// =====================================================
// Helper functions
// =====================================================

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// =====================================================
// Component
// =====================================================

export default function SupportPage() {
  // State
  const [tickets, setTickets] = useState<Ticket[]>(generateMockTickets);
  const [activeTab, setActiveTab] = useState('tickets');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketFilter, setTicketFilter] = useState<string>('all');
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketReply, setTicketReply] = useState('');

  // New ticket dialog
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<TicketCategory>('general');
  const [newPriority, setNewPriority] = useState<TicketPriority>('medium');

  // Live chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatActive, setChatActive] = useState(false);
  const [chatConnecting, setChatConnecting] = useState(false);
  const [liveAgent, setLiveAgent] = useState<typeof AGENTS[0] | null>(null);
  const [chatTyping, setChatTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // File upload state
  const [ticketFiles, setTicketFiles] = useState<FileAttachment[]>([]);
  const [chatFiles, setChatFiles] = useState<FileAttachment[]>([]);
  const ticketFileRef = useRef<HTMLInputElement>(null);
  const chatFileRef = useRef<HTMLInputElement>(null);
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  // Phone state
  const [callActive, setCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callMuted, setCallMuted] = useState(false);
  const [callOnHold, setCallOnHold] = useState(false);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatTyping]);

  // Call timer
  useEffect(() => {
    if (callActive) {
      callTimerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      setCallDuration(0);
    }
    return () => { if (callTimerRef.current) clearInterval(callTimerRef.current); };
  }, [callActive]);

  // File upload handler
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>, target: 'ticket' | 'chat') => {
    const files = e.target.files;
    if (!files) return;
    const setFiles = target === 'ticket' ? setTicketFiles : setChatFiles;
    const newAttachments: FileAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: 'File too large', description: `${file.name} exceeds the 5MB limit.`, variant: 'destructive' });
        continue;
      }
      newAttachments.push({
        id: `file-${Date.now()}-${i}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
      });
    }
    if (newAttachments.length) {
      setFiles(prev => [...prev, ...newAttachments]);
    }
    e.target.value = '';
  }, []);

  const removeFile = useCallback((fileId: string, target: 'ticket' | 'chat') => {
    const setFiles = target === 'ticket' ? setTicketFiles : setChatFiles;
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file) URL.revokeObjectURL(file.url);
      return prev.filter(f => f.id !== fileId);
    });
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    let result = tickets;
    if (ticketFilter !== 'all') {
      result = result.filter(t => t.status === ticketFilter);
    }
    if (ticketSearch) {
      const q = ticketSearch.toLowerCase();
      result = result.filter(t =>
        t.subject.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [tickets, ticketFilter, ticketSearch]);

  // KPI stats
  const stats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length,
    waiting: tickets.filter(t => t.status === 'waiting_on_customer').length,
    resolved: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
    avgSatisfaction: (() => {
      const rated = tickets.filter(t => t.satisfaction);
      return rated.length ? (rated.reduce((s, t) => s + (t.satisfaction || 0), 0) / rated.length).toFixed(1) : 'N/A';
    })(),
    slaCompliance: (() => {
      const withSla = tickets.filter(t => t.sla);
      const met = withSla.filter(t => t.sla.elapsed <= t.sla.target);
      return withSla.length ? Math.round((met.length / withSla.length) * 100) : 100;
    })(),
  }), [tickets]);

  // Create new ticket
  const handleCreateTicket = useCallback(() => {
    if (!newSubject.trim()) return;
    const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)];
    const ticket: Ticket = {
      id: `TKT-2024-${String(tickets.length + 1).padStart(3, '0')}`,
      subject: newSubject,
      description: newDescription,
      category: newCategory,
      priority: newPriority,
      status: 'open',
      assignee: agent.name,
      assigneeAvatar: agent.initials,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sla: { target: PRIORITY_CONFIG[newPriority].slaHours * 60, elapsed: 0 },
      messages: [
        { id: `m-${Date.now()}`, sender: 'customer', senderName: 'You', message: newDescription || newSubject, timestamp: new Date().toISOString() },
        { id: `m-${Date.now() + 1}`, sender: 'system', senderName: 'System', message: `Ticket assigned to ${agent.name} (${agent.role})`, timestamp: new Date().toISOString() },
      ],
    };
    setTickets(prev => [ticket, ...prev]);
    setNewTicketOpen(false);
    setNewSubject('');
    setNewDescription('');
    setNewCategory('general');
    setNewPriority('medium');
    setSelectedTicket(ticket);
    toast({ title: 'Ticket created', description: `${ticket.id} has been submitted and assigned to ${agent.name}.` });
  }, [newSubject, newDescription, newCategory, newPriority, tickets.length]);

  // Send ticket reply
  const handleSendReply = useCallback(() => {
    if ((!ticketReply.trim() && ticketFiles.length === 0) || !selectedTicket) return;
    const attachmentNames = ticketFiles.map(f => f.name);
    const msgText = ticketReply.trim()
      ? ticketFiles.length > 0
        ? `${ticketReply}\n\n📎 ${attachmentNames.join(', ')}`
        : ticketReply
      : `📎 ${attachmentNames.join(', ')}`;
    const newMsg: TicketMessage = {
      id: `m-${Date.now()}`,
      sender: 'customer',
      senderName: 'You',
      message: msgText,
      timestamp: new Date().toISOString(),
      attachments: attachmentNames.length > 0 ? attachmentNames : undefined,
    };
    setTickets(prev => prev.map(t =>
      t.id === selectedTicket.id
        ? { ...t, messages: [...t.messages, newMsg], updatedAt: new Date().toISOString(), status: t.status === 'waiting_on_customer' ? 'in_progress' : t.status }
        : t
    ));
    setSelectedTicket(prev => prev ? { ...prev, messages: [...prev.messages, newMsg], status: prev.status === 'waiting_on_customer' ? 'in_progress' : prev.status } : prev);
    setTicketReply('');
    setTicketFiles([]);
  }, [ticketReply, selectedTicket, ticketFiles]);

  // Start live chat — connects directly to a human agent
  const startChat = useCallback(() => {
    setChatActive(true);
    setChatConnecting(true);
    const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)];

    // Connecting message
    setChatMessages([{
      id: 'system-connect',
      sender: 'bot',
      senderName: 'System',
      message: `Connecting you to a support agent... Please hold.`,
      timestamp: new Date(),
    }]);

    // Agent joins after short delay
    setTimeout(() => {
      setLiveAgent(agent);
      setChatConnecting(false);
      setChatMessages(prev => [...prev, {
        id: `system-joined-${Date.now()}`,
        sender: 'bot',
        senderName: 'System',
        message: `${agent.name} (${agent.role}) has joined the chat.`,
        timestamp: new Date(),
      }, {
        id: `agent-greeting-${Date.now()}`,
        sender: 'agent',
        senderName: agent.name,
        message: `Hi there! I'm ${agent.name}, your ${agent.speciality.toLowerCase()} specialist. How can I help you today?`,
        timestamp: new Date(),
      }]);
    }, 1500);
  }, []);

  // Send chat message — responses come from live agent
  const handleSendChat = useCallback(() => {
    if (!chatInput.trim() && chatFiles.length === 0) return;
    const attachmentNames = chatFiles.map(f => f.name);
    const msgText = chatInput.trim()
      ? chatFiles.length > 0
        ? `${chatInput}\n\n📎 ${attachmentNames.join(', ')}`
        : chatInput
      : `📎 ${attachmentNames.join(', ')}`;
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      senderName: 'You',
      message: msgText,
      timestamp: new Date(),
      attachments: chatFiles.length > 0 ? [...chatFiles] : undefined,
    };
    setChatFiles([]);
    setChatMessages(prev => [...prev, userMsg]);
    const input = chatInput.toLowerCase();
    setChatInput('');

    // Agent is typing
    setChatTyping(true);
    setTimeout(() => {
      setChatTyping(false);

      // Pick a contextual response based on keywords
      let pool = AGENT_RESPONSES.default;
      if (input.includes('billing') || input.includes('invoice') || input.includes('cost') || input.includes('charge') || input.includes('payment')) {
        pool = AGENT_RESPONSES.billing;
      } else if (input.includes('technical') || input.includes('error') || input.includes('issue') || input.includes('bug') || input.includes('not working') || input.includes('broken')) {
        pool = AGENT_RESPONSES.technical;
      } else if (input.includes('slow') || input.includes('performance') || input.includes('latency') || input.includes('speed')) {
        pool = AGENT_RESPONSES.performance;
      } else if (input.includes('access') || input.includes('permission') || input.includes('iam') || input.includes('login') || input.includes('403') || input.includes('forbidden')) {
        pool = AGENT_RESPONSES.access;
      }

      const response = pool[Math.floor(Math.random() * pool.length)];
      const agentName = liveAgent?.name || 'Support Agent';

      setChatMessages(prev => [...prev, {
        id: `response-${Date.now()}`,
        sender: 'agent',
        senderName: agentName,
        message: response,
        timestamp: new Date(),
      }]);
    }, 1500 + Math.random() * 1500);
  }, [chatInput, chatFiles, liveAgent]);

  // Start phone call
  const startCall = useCallback(() => {
    setCallActive(true);
    toast({ title: 'Connecting call...', description: 'You will be connected to the next available agent.' });
  }, []);

  const endCall = useCallback(() => {
    setCallActive(false);
    setCallMuted(false);
    setCallOnHold(false);
    toast({ title: 'Call ended', description: `Duration: ${Math.floor(callDuration / 60)}:${String(callDuration % 60).padStart(2, '0')}` });
  }, [callDuration]);

  // =====================================================
  // Render
  // =====================================================

  return (
    <section aria-label="Support Center" className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <MdHeadsetMic className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Support Center</h1>
            <p className="text-sm text-muted-foreground">Manage tickets, live chat, and phone support</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { setActiveTab('chat'); if (!chatActive) startChat(); }}>
            <MdChat className="h-4 w-4 mr-1.5" /> Live Chat
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setActiveTab('phone'); if (!callActive) startCall(); }}>
            <MdPhone className="h-4 w-4 mr-1.5" /> Call Support
          </Button>
          <Button size="sm" onClick={() => setNewTicketOpen(true)}>
            <MdAdd className="h-4 w-4 mr-1.5" /> New Ticket
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
      >
        {[
          { label: 'Total Tickets', value: stats.total, icon: MdDescription, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Active', value: stats.open, icon: MdErrorOutline, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: 'Awaiting Reply', value: stats.waiting, icon: MdAccessTime, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Resolved', value: stats.resolved, icon: MdCheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Satisfaction', value: `${stats.avgSatisfaction}/5`, icon: MdStar, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
          { label: 'SLA Met', value: `${stats.slaCompliance}%`, icon: MdShield, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        ].map((kpi, i) => (
          <Card key={i} className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                </div>
                <div className={cn('p-2.5 rounded-lg', kpi.bg)}>
                  <kpi.icon className={cn('h-5 w-5', kpi.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="tickets" className="gap-1.5">
            <MdDescription className="h-3.5 w-3.5" /> Tickets
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-1.5">
            <MdChat className="h-3.5 w-3.5" /> Live Chat
            {chatActive && <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
          </TabsTrigger>
          <TabsTrigger value="phone" className="gap-1.5">
            <MdPhone className="h-3.5 w-3.5" /> Phone
            {callActive && <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
          </TabsTrigger>
        </TabsList>

        {/* ===== TICKETS TAB ===== */}
        <TabsContent value="tickets" className="mt-4">
          <div className="flex gap-4 h-[calc(100vh-22rem)]">
            {/* Ticket list */}
            <div className="w-[420px] flex-shrink-0 flex flex-col border rounded-lg overflow-hidden">
              {/* Filters */}
              <div className="p-3 border-b bg-muted/30 space-y-2">
                <div className="relative">
                  <MdSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input className="pl-8 h-8 text-sm" placeholder="Search tickets..." value={ticketSearch} onChange={e => setTicketSearch(e.target.value)} />
                </div>
                <div className="flex gap-1 flex-wrap">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'open', label: 'Open' },
                    { value: 'in_progress', label: 'Active' },
                    { value: 'waiting_on_customer', label: 'Waiting' },
                    { value: 'resolved', label: 'Resolved' },
                  ].map(f => (
                    <button
                      key={f.value}
                      onClick={() => setTicketFilter(f.value)}
                      className={cn(
                        'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                        ticketFilter === f.value ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted text-muted-foreground'
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto divide-y">
                {filteredTickets.map(ticket => {
                  const pConfig = PRIORITY_CONFIG[ticket.priority];
                  const sConfig = STATUS_CONFIG[ticket.status];
                  const isActive = selectedTicket?.id === ticket.id;
                  const slaPercent = Math.min((ticket.sla.elapsed / ticket.sla.target) * 100, 100);
                  const slaDanger = slaPercent > 80;
                  return (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={cn(
                        'w-full text-left p-3.5 transition-colors',
                        isActive ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/50 border-l-2 border-l-transparent'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="text-sm font-medium leading-snug line-clamp-2">{ticket.subject}</p>
                        <Badge variant="outline" className={cn('text-[10px] px-1.5 flex-shrink-0 h-5', pConfig.badge)}>
                          {pConfig.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="font-mono">{ticket.id}</span>
                        <span>&middot;</span>
                        <Badge variant="outline" className={cn('text-[10px] px-1.5 h-4 gap-0.5', sConfig.color)}>
                          <sConfig.icon className="h-2.5 w-2.5" />
                          {sConfig.label}
                        </Badge>
                        <span>&middot;</span>
                        <span>{timeAgo(ticket.updatedAt)}</span>
                      </div>
                      {/* SLA bar */}
                      <div className="mt-2">
                        <div className="h-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all', slaDanger ? 'bg-red-500' : 'bg-green-500')}
                            style={{ width: `${slaPercent}%` }}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
                {filteredTickets.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <MdDescription className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No tickets found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Ticket detail */}
            <div className="flex-1 border rounded-lg overflow-hidden flex flex-col">
              {selectedTicket ? (
                <>
                  {/* Detail header */}
                  <div className="p-4 border-b bg-muted/20">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-muted-foreground">{selectedTicket.id}</span>
                          <Badge variant="outline" className={cn('text-[10px] px-1.5', PRIORITY_CONFIG[selectedTicket.priority].badge)}>
                            {PRIORITY_CONFIG[selectedTicket.priority].label}
                          </Badge>
                          <Badge variant="outline" className={cn('text-[10px] px-1.5 gap-0.5', STATUS_CONFIG[selectedTicket.status].color)}>
                            {STATUS_CONFIG[selectedTicket.status].label}
                          </Badge>
                        </div>
                        <h2 className="text-base font-semibold">{selectedTicket.subject}</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{selectedTicket.assigneeAvatar}</AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">{selectedTicket.assignee}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Assigned agent</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    {/* SLA */}
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-muted-foreground">SLA Progress</span>
                          <span className={cn(
                            'font-medium',
                            selectedTicket.sla.elapsed > selectedTicket.sla.target ? 'text-red-500' : 'text-green-600'
                          )}>
                            {Math.floor(selectedTicket.sla.elapsed / 60)}h {selectedTicket.sla.elapsed % 60}m / {Math.floor(selectedTicket.sla.target / 60)}h
                          </span>
                        </div>
                        <Progress
                          value={Math.min((selectedTicket.sla.elapsed / selectedTicket.sla.target) * 100, 100)}
                          className={cn('h-1.5', selectedTicket.sla.elapsed > selectedTicket.sla.target * 0.8 ? '[&>div]:bg-red-500' : '[&>div]:bg-green-500')}
                        />
                      </div>
                      {selectedTicket.satisfaction && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/10">
                          <MdStar className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs font-medium text-yellow-600">{selectedTicket.satisfaction}/5</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {selectedTicket.messages.map(msg => (
                      <div key={msg.id} className={cn('flex gap-3', msg.sender === 'customer' ? 'flex-row-reverse' : '')}>
                        {msg.sender !== 'system' && (
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className={cn(
                              'text-xs',
                              msg.sender === 'customer' ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-600'
                            )}>
                              {msg.sender === 'customer' ? 'You' : msg.senderName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className={cn(
                          'max-w-[70%] rounded-lg p-3',
                          msg.sender === 'customer' ? 'bg-primary text-primary-foreground' :
                          msg.sender === 'system' ? 'bg-muted/50 text-muted-foreground text-center w-full max-w-full text-xs py-2' :
                          'bg-muted'
                        )}>
                          {msg.sender !== 'system' && (
                            <p className={cn('text-xs font-medium mb-1', msg.sender === 'customer' ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                              {msg.senderName}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          <p className={cn('text-[10px] mt-1.5', msg.sender === 'customer' ? 'text-primary-foreground/60' : 'text-muted-foreground/60')}>
                            {timeAgo(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reply box */}
                  {selectedTicket.status !== 'closed' && (
                    <div className="p-3 border-t bg-muted/10 space-y-2">
                      {/* File previews */}
                      {ticketFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {ticketFiles.map(f => (
                            <div key={f.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-muted border text-xs">
                              {f.type.startsWith('image/') ? (
                                <img src={f.url} alt={f.name} className="h-8 w-8 rounded object-cover" />
                              ) : (
                                <MdDescription className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="truncate max-w-[120px] font-medium">{f.name}</p>
                                <p className="text-muted-foreground text-[10px]">{formatFileSize(f.size)}</p>
                              </div>
                              <button onClick={() => removeFile(f.id, 'ticket')} className="text-muted-foreground hover:text-destructive flex-shrink-0">
                                <MdClose className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input ref={ticketFileRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.txt,.log,.zip" multiple onChange={e => handleFileSelect(e, 'ticket')} />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 flex-shrink-0 text-muted-foreground" onClick={() => ticketFileRef.current?.click()}>
                              <MdAttachFile className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Attach file (max 5MB)</TooltipContent>
                        </Tooltip>
                        <Input
                          className="flex-1 h-10"
                          placeholder="Type your reply..."
                          value={ticketReply}
                          onChange={e => setTicketReply(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                        />
                        <Button size="icon" className="h-10 w-10" onClick={handleSendReply} disabled={!ticketReply.trim() && ticketFiles.length === 0}>
                          <MdSend className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MdChat className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">Select a ticket to view details</p>
                    <p className="text-xs mt-1">Or create a new support ticket</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ===== LIVE CHAT TAB ===== */}
        <TabsContent value="chat" className="mt-4">
          <Card className="bg-card/50 backdrop-blur-sm border-card-border h-[calc(100vh-22rem)] flex flex-col overflow-hidden">
            {!chatActive ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <MdHeadsetMic className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Chat with Support</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Connect directly with a live support agent. Average response time: under 2 minutes.
                  </p>
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      { icon: MdPerson, label: 'Human Agent', desc: 'Real specialists' },
                      { icon: MdShield, label: 'Secure Chat', desc: 'Encrypted' },
                      { icon: MdAccessTime, label: '24/7 Available', desc: 'Always here' },
                    ].map((item, i) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/50 border text-center">
                        <item.icon className="h-5 w-5 mx-auto mb-1.5 text-muted-foreground" />
                        <p className="text-xs font-medium">{item.label}</p>
                        <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                  <Button size="lg" onClick={startChat}>
                    <MdChat className="h-4 w-4 mr-2" /> Connect to Agent
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="px-4 py-3 border-b bg-muted/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {liveAgent ? liveAgent.initials : <MdHeadsetMic className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{liveAgent ? liveAgent.name : 'Connecting...'}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {liveAgent ? `${liveAgent.role} · ${liveAgent.speciality}` : 'Finding available agent...'}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive" onClick={() => { setChatActive(false); setLiveAgent(null); setChatMessages([]); }}>
                    End Chat
                  </Button>
                </div>

                {/* Chat messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.map(msg => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn('flex gap-2.5', msg.sender === 'user' ? 'flex-row-reverse' : '')}
                    >
                      {msg.sender !== 'user' && (
                        <Avatar className="h-7 w-7 flex-shrink-0">
                          <AvatarFallback className={cn('text-[10px]', msg.sender === 'agent' ? 'bg-blue-500/10 text-blue-600' : 'bg-muted text-muted-foreground')}>
                            {msg.sender === 'agent' ? (liveAgent?.initials || 'AG') : <MdHeadsetMic className="h-3.5 w-3.5" />}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={cn(
                        'max-w-[75%] rounded-lg px-3.5 py-2.5',
                        msg.sender === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-muted rounded-bl-sm'
                      )}>
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        {/* Attachment thumbnails */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {msg.attachments.map(att => (
                              <div key={att.id} className="rounded overflow-hidden border border-white/20">
                                {att.type.startsWith('image/') ? (
                                  <img src={att.url} alt={att.name} className="h-20 w-20 object-cover cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.open(att.url, '_blank')} />
                                ) : (
                                  <div className="flex items-center gap-1.5 px-2 py-1.5 bg-black/10 text-xs">
                                    <MdDescription className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span className="truncate max-w-[80px]">{att.name}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        <p className={cn('text-[10px] mt-1', msg.sender === 'user' ? 'text-primary-foreground/50' : 'text-muted-foreground/50')}>
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    </motion.div>
                  ))}

                  {chatTyping && (
                    <div className="flex gap-2.5">
                      <Avatar className="h-7 w-7 flex-shrink-0">
                        <AvatarFallback className="text-[10px] bg-blue-500/10 text-blue-600">
                          {liveAgent ? liveAgent.initials : <MdHeadsetMic className="h-3.5 w-3.5" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-lg rounded-bl-sm px-4 py-3">
                        <div className="flex gap-1">
                          <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat input */}
                <div className="p-3 border-t bg-background space-y-2">
                  {/* File previews */}
                  {chatFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {chatFiles.map(f => (
                        <div key={f.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-muted border text-xs">
                          {f.type.startsWith('image/') ? (
                            <img src={f.url} alt={f.name} className="h-8 w-8 rounded object-cover" />
                          ) : (
                            <MdDescription className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="truncate max-w-[120px] font-medium">{f.name}</p>
                            <p className="text-muted-foreground text-[10px]">{formatFileSize(f.size)}</p>
                          </div>
                          <button onClick={() => removeFile(f.id, 'chat')} className="text-muted-foreground hover:text-destructive flex-shrink-0">
                            <MdClose className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input ref={chatFileRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.txt,.log,.zip" multiple onChange={e => handleFileSelect(e, 'chat')} />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 flex-shrink-0 text-muted-foreground" onClick={() => chatFileRef.current?.click()} disabled={chatConnecting || !liveAgent}>
                          <MdAttachFile className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Attach file (max 5MB)</TooltipContent>
                    </Tooltip>
                    <Input
                      className="flex-1 h-10"
                      placeholder={liveAgent ? `Message ${liveAgent.name}...` : 'Connecting to agent...'}
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSendChat(); }}
                      disabled={chatConnecting || !liveAgent}
                    />
                    <Button size="icon" className="h-10 w-10 flex-shrink-0" onClick={handleSendChat} disabled={(!chatInput.trim() && chatFiles.length === 0) || chatConnecting || !liveAgent}>
                      <MdSend className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[10px] text-muted-foreground">
                      {liveAgent ? (
                        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-green-500" /> {liveAgent.name} is online</span>
                      ) : (
                        <span className="flex items-center gap-1"><MdSync className="h-3 w-3 animate-spin" /> Finding available agent...</span>
                      )}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Max 5MB &middot; Encrypted</p>
                  </div>
                </div>
              </>
            )}
          </Card>
        </TabsContent>

        {/* ===== PHONE TAB ===== */}
        <TabsContent value="phone" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Phone call UI */}
            <Card className="bg-card/50 backdrop-blur-sm border-card-border overflow-hidden">
              <CardContent className="p-0">
                {!callActive ? (
                  <div className="p-8 text-center">
                    <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-5">
                      <MdPhone className="h-12 w-12 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Call Support</h3>
                    <p className="text-sm text-muted-foreground mb-1">Talk to a specialist directly</p>
                    <p className="text-xs text-muted-foreground mb-6">Average wait time: 1-3 minutes</p>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 text-left">
                        <div className="p-2 rounded-full bg-blue-500/10">
                          <MdFlashOn className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Priority Queue</p>
                          <p className="text-xs text-muted-foreground">Enterprise customers get priority routing</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 text-left">
                        <div className="p-2 rounded-full bg-purple-500/10">
                          <MdShield className="h-4 w-4 text-purple-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Secure & Recorded</p>
                          <p className="text-xs text-muted-foreground">All calls are encrypted and recorded for quality</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 text-left">
                        <div className="p-2 rounded-full bg-green-500/10">
                          <MdAccessTime className="h-4 w-4 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">24/7 Availability</p>
                          <p className="text-xs text-muted-foreground">Support available around the clock</p>
                        </div>
                      </div>
                    </div>

                    <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white border-0 shadow-none ring-0 outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0" onClick={startCall}>
                      <MdPhoneInTalk className="h-4 w-4 mr-2" /> Start Call
                    </Button>
                  </div>
                ) : (
                  <div className="p-8">
                    {/* Active call UI */}
                    <div className="text-center mb-8">
                      <div className="relative inline-block mb-4">
                        <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse">
                          <Avatar className="h-16 w-16">
                            <AvatarFallback className="bg-green-500 text-white text-lg">PS</AvatarFallback>
                          </Avatar>
                        </div>
                        <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-background" />
                      </div>
                      <h3 className="text-lg font-semibold">Priya Sharma</h3>
                      <p className="text-sm text-muted-foreground">Support Lead &middot; General & Escalations</p>
                      <p className="text-2xl font-mono font-bold text-green-600 mt-3">
                        {Math.floor(callDuration / 60)}:{String(callDuration % 60).padStart(2, '0')}
                      </p>
                      {callOnHold && (
                        <Badge variant="outline" className="mt-2 bg-amber-500/10 text-amber-600 border-amber-200">
                          <MdAccessTime className="h-3 w-3 mr-1" /> On Hold
                        </Badge>
                      )}
                    </div>

                    {/* Call controls */}
                    <div className="flex items-center justify-center gap-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className={cn('h-14 w-14 rounded-full', callMuted && 'bg-red-500/10 border-red-200')}
                            onClick={() => setCallMuted(!callMuted)}
                          >
                            {callMuted ? <MdMicOff className="h-5 w-5 text-red-500" /> : <MdMic className="h-5 w-5" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{callMuted ? 'Unmute' : 'Mute'}</TooltipContent>
                      </Tooltip>

                      <Button
                        size="icon"
                        className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700"
                        onClick={endCall}
                      >
                        <MdPhoneDisabled className="h-6 w-6" />
                      </Button>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className={cn('h-14 w-14 rounded-full', callOnHold && 'bg-amber-500/10 border-amber-200')}
                            onClick={() => setCallOnHold(!callOnHold)}
                          >
                            {callOnHold ? <MdAccessTime className="h-5 w-5 text-amber-500" /> : <MdAccessTime className="h-5 w-5" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{callOnHold ? 'Resume' : 'Hold'}</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Support hours & info */}
            <div className="space-y-4">
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Support Hours</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: 'Critical Issues (P1)', hours: '24/7/365', color: 'text-red-500' },
                    { label: 'High Priority (P2)', hours: '24/7/365', color: 'text-orange-500' },
                    { label: 'Medium Priority (P3)', hours: 'Mon-Sat, 6AM-10PM WAT', color: 'text-amber-500' },
                    { label: 'Low Priority (P4)', hours: 'Mon-Fri, 8AM-6PM WAT', color: 'text-blue-500' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className={cn('text-sm font-medium', item.color)}>{item.label}</span>
                      <span className="text-sm text-muted-foreground">{item.hours}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Direct Lines</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { label: 'Nigeria', number: '+234 (0) 1 277 0000', flag: 'NG' },
                    { label: 'South Africa', number: '+27 (0) 11 234 5678', flag: 'ZA' },
                    { label: 'Kenya', number: '+254 (0) 20 765 4321', flag: 'KE' },
                    { label: 'International', number: '+86 400 886 9800', flag: 'CN' },
                  ].map((line, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold bg-muted px-1.5 py-0.5 rounded">{line.flag}</span>
                        <span className="text-sm">{line.label}</span>
                      </div>
                      <span className="text-sm font-mono text-muted-foreground">{line.number}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Your Support Team</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {AGENTS.map((agent, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">{agent.initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{agent.name}</p>
                        <p className="text-[11px] text-muted-foreground">{agent.role} &middot; {agent.speciality}</p>
                      </div>
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ===== NEW TICKET DIALOG ===== */}
      <Dialog open={newTicketOpen} onOpenChange={setNewTicketOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>Describe your issue and we'll route it to the right specialist.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Subject <span className="text-red-500">*</span></Label>
              <Input placeholder="Brief summary of your issue" value={newSubject} onChange={e => setNewSubject(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={newCategory} onValueChange={(v: TicketCategory) => setNewCategory(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>
                        <span className="flex items-center gap-2"><c.icon className="h-3.5 w-3.5" /> {c.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={newPriority} onValueChange={(v: TicketPriority) => setNewPriority(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(([val, cfg]) => (
                      <SelectItem key={val} value={val}>
                        <span className={cn('flex items-center gap-2', cfg.color)}>
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'currentColor' }} />
                          {cfg.label} — SLA: {cfg.slaHours}h
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="Provide as much detail as possible — error messages, affected resources, timestamps..."
                rows={4}
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTicketOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTicket} disabled={!newSubject.trim()}>Submit Ticket</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
