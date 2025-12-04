import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  HelpCircle,
  TrendingUp,
  PiggyBank,
  Server,
  Shield,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// =====================================================
// ENHANCED NLP SYSTEM
// =====================================================

// Synonym mappings for better understanding
const synonyms: Record<string, string[]> = {
  cost: ['price', 'spend', 'spending', 'expense', 'money', 'billing', 'bill', 'charge', 'fee', 'payment'],
  reduce: ['lower', 'decrease', 'cut', 'minimize', 'save', 'saving', 'savings', 'less', 'drop', 'shrink'],
  help: ['assist', 'support', 'guide', 'explain', 'tell', 'show', 'how'],
  what: ['whats', "what's", 'define', 'meaning', 'explain', 'description'],
  budget: ['limit', 'allocation', 'cap', 'threshold', 'allowance'],
  resource: ['server', 'instance', 'machine', 'vm', 'compute', 'service', 'asset'],
  optimize: ['improve', 'better', 'enhance', 'efficient', 'efficiency', 'performance'],
  idle: ['unused', 'inactive', 'dormant', 'waste', 'wasted', 'empty'],
  connect: ['link', 'integrate', 'setup', 'configure', 'api', 'credential'],
  report: ['export', 'download', 'generate', 'csv', 'pdf', 'document'],
  tenant: ['organization', 'company', 'business', 'client', 'account', 'unit'],
  currency: ['money', 'dollar', 'naira', 'euro', 'pound', 'yen', 'yuan', 'usd', 'ngn', 'gbp', 'eur', 'jpy', 'cny'],
};

// Intent patterns for better classification
const intentPatterns: { intent: string; patterns: RegExp[]; response?: string }[] = [
  // Greetings
  {
    intent: 'greeting',
    patterns: [
      /^(hi|hello|hey|howdy|greetings|good\s*(morning|afternoon|evening))[\s!.,?]*$/i,
      /^(sup|yo|hiya)[\s!.,?]*$/i,
    ],
    response: "Hello! I'm your FinOps Assistant. I can help you with:\n\n" +
      "- Understanding cloud costs and billing\n" +
      "- Cost optimization recommendations\n" +
      "- Resource management questions\n" +
      "- Dashboard navigation help\n\n" +
      "What would you like to know?",
  },
  // Thanks
  {
    intent: 'thanks',
    patterns: [
      /^(thanks?|thank\s*you|thx|ty|cheers|appreciated?)[\s!.,?]*$/i,
      /^(thanks?\s*(a lot|so much|very much))[\s!.,?]*$/i,
    ],
    response: "You're welcome! Is there anything else I can help you with? Feel free to ask about costs, optimization, or any dashboard features.",
  },
  // Goodbye
  {
    intent: 'goodbye',
    patterns: [
      /^(bye|goodbye|see\s*ya|later|cya|farewell)[\s!.,?]*$/i,
      /^(that'?s?\s*all|nothing\s*(else|more)|i'?m?\s*(good|done|fine))[\s!.,?]*$/i,
    ],
    response: "Goodbye! Feel free to come back anytime you have questions about your cloud costs. Have a great day!",
  },
  // Affirmative
  {
    intent: 'affirmative',
    patterns: [
      /^(yes|yeah|yep|yup|sure|ok|okay|correct|right|exactly)[\s!.,?]*$/i,
    ],
    response: "Great! What else would you like to know? I can help with cost analysis, optimization tips, or explain any dashboard features.",
  },
  // Negative
  {
    intent: 'negative',
    patterns: [
      /^(no|nope|nah|not\s*really)[\s!.,?]*$/i,
    ],
    response: "No problem! Let me know if you have any other questions. I'm here to help with anything related to your cloud costs and this dashboard.",
  },
  // Help request
  {
    intent: 'help',
    patterns: [
      /^(help|help\s*me|i\s*need\s*help|can\s*you\s*help)[\s!.,?]*$/i,
      /^(what\s*can\s*you\s*do|what\s*do\s*you\s*do|your\s*capabilities)[\s!.,?]*$/i,
    ],
    response: "I can help you with many things! Here's what I know:\n\n" +
      "**Costs & Billing**\n- How costs are calculated\n- Understanding MTD spend\n- Budget utilization\n\n" +
      "**Optimization**\n- Cost reduction strategies\n- Rightsizing recommendations\n- Reserved instances\n- Identifying idle resources\n\n" +
      "**Resources**\n- ECS, RDS, OBS services\n- Resource utilization\n- Storage differences\n\n" +
      "**Dashboard**\n- Changing currency\n- Filtering by tenant\n- Exporting reports\n\n" +
      "Just ask me anything!",
  },
];

// FAQ Categories and Questions
interface FAQItem {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  category: 'costs' | 'optimization' | 'resources' | 'security' | 'general' | 'dashboard';
  followUp?: string[];
}

const faqData: FAQItem[] = [
  // Costs & Billing
  {
    id: 'cost-1',
    question: 'How is my cloud cost calculated?',
    answer: 'Your cloud cost is calculated based on resource usage including:\n\n' +
      '**Compute (ECS)** - Based on instance type, vCPUs, memory, and running hours\n' +
      '**Storage (OBS, EVS)** - Based on capacity (GB) and data operations\n' +
      '**Database (RDS, GaussDB)** - Based on instance size and storage\n' +
      '**Network (ELB, CDN, NAT)** - Based on data transfer and requests\n\n' +
      'Each service uses pay-as-you-go pricing, billed hourly or monthly.',
    keywords: ['cost', 'calculate', 'billing', 'price', 'charge', 'pay', 'how much', 'computed', 'work'],
    category: 'costs',
    followUp: ['How do I reduce my cloud costs?', 'What is MTD spend?'],
  },
  {
    id: 'cost-2',
    question: 'What does MTD spend mean?',
    answer: 'MTD (Month-To-Date) spend is your total cloud expenditure from the 1st of the current month until today.\n\n' +
      '**Example:** If today is the 15th and you\'ve spent $50,000, that\'s your MTD spend.\n\n' +
      'It helps you:\n' +
      '- Track spending progress against your monthly budget\n' +
      '- Predict end-of-month costs\n' +
      '- Identify spending anomalies early',
    keywords: ['mtd', 'month', 'spend', 'spending', 'total', 'date', 'monthly'],
    category: 'costs',
    followUp: ['What is budget utilization?', 'How do I set a budget?'],
  },
  {
    id: 'cost-3',
    question: 'How do I reduce my cloud costs?',
    answer: 'Here are the top strategies to reduce cloud costs:\n\n' +
      '**1. Implement Recommendations** - Check the Optimization tab for AI-generated savings opportunities\n\n' +
      '**2. Rightsize Resources** - Downsize instances with low CPU/memory utilization\n\n' +
      '**3. Eliminate Waste** - Delete idle resources, unattached volumes, and old snapshots\n\n' +
      '**4. Use Reserved Instances** - Save 30-50% on stable workloads with 1-3 year commitments\n\n' +
      '**5. Optimize Storage** - Move cold data to cheaper storage tiers (Standard-IA)\n\n' +
      '**6. Set Budget Alerts** - Get notified before overspending',
    keywords: ['reduce', 'save', 'saving', 'lower', 'decrease', 'cut', 'less', 'cheaper', 'minimize', 'optimize'],
    category: 'costs',
    followUp: ['What is rightsizing?', 'What are reserved instances?'],
  },
  {
    id: 'cost-4',
    question: 'What is budget utilization?',
    answer: 'Budget utilization shows the percentage of your allocated budget that has been spent.\n\n' +
      '**Formula:** (Current Spend ÷ Total Budget) × 100\n\n' +
      '**Example:** If your budget is $100,000 and you\'ve spent $75,000, utilization is 75%\n\n' +
      '**Guidelines:**\n' +
      '- 🟢 Under 70% - On track\n' +
      '- 🟡 70-85% - Monitor closely\n' +
      '- 🔴 Over 85% - Risk of overage\n\n' +
      'Set alerts at 80% to avoid surprises!',
    keywords: ['budget', 'utilization', 'usage', 'allocation', 'limit', 'percent', 'percentage', 'threshold'],
    category: 'costs',
    followUp: ['How do I set budget alerts?', 'How do I create a budget?'],
  },
  {
    id: 'cost-5',
    question: 'Why did my costs increase?',
    answer: 'Common reasons for cost increases:\n\n' +
      '**1. New Resources** - Recently provisioned servers, databases, or storage\n\n' +
      '**2. Traffic Spikes** - Increased data transfer or API calls\n\n' +
      '**3. Scaling Events** - Auto-scaling adding more instances\n\n' +
      '**4. Storage Growth** - Database or object storage accumulation\n\n' +
      '**5. Price Changes** - Service pricing updates (rare)\n\n' +
      'Check the Analytics page to see cost breakdown by service and identify the source.',
    keywords: ['increase', 'spike', 'higher', 'more', 'why', 'grew', 'growth', 'up', 'rise', 'jumped'],
    category: 'costs',
  },
  // Optimization
  {
    id: 'opt-1',
    question: 'What are optimization recommendations?',
    answer: 'Optimization recommendations are AI-generated suggestions to reduce costs and improve efficiency.\n\n' +
      '**Types of Recommendations:**\n' +
      '- **Rightsizing** - Resize oversized instances\n' +
      '- **Idle Resources** - Terminate unused assets\n' +
      '- **Reserved Instances** - Long-term commitments for savings\n' +
      '- **Storage Optimization** - Move data to cheaper tiers\n' +
      '- **Network Optimization** - Improve CDN caching, consolidate NAT\n\n' +
      '**Impact Levels:** High (>$500/mo), Medium ($100-500/mo), Low (<$100/mo)\n\n' +
      'Find these in the Recommendations page!',
    keywords: ['optimization', 'recommendation', 'suggest', 'improve', 'efficient', 'opportunity', 'advice', 'tip'],
    category: 'optimization',
    followUp: ['How do I implement recommendations?', 'What is rightsizing?'],
  },
  {
    id: 'opt-2',
    question: 'What does rightsizing mean?',
    answer: 'Rightsizing means adjusting resource capacity to match actual usage.\n\n' +
      '**Example:**\n' +
      'If an ECS instance (s6.xlarge.4 with 4 vCPUs, 16GB RAM) consistently uses only 15% CPU, you can downsize to s6.large.2 (2 vCPUs, 8GB RAM) and save ~50%.\n\n' +
      '**How to Identify:**\n' +
      '- Check Resources page for utilization metrics\n' +
      '- Look for instances with <30% average CPU\n' +
      '- Review memory utilization patterns\n\n' +
      '**Savings:** Typically 30-60% per rightsized resource',
    keywords: ['rightsize', 'rightsizing', 'resize', 'downsize', 'size', 'capacity', 'underutilized', 'oversized'],
    category: 'optimization',
  },
  {
    id: 'opt-3',
    question: 'What are reserved instances?',
    answer: 'Reserved instances (RIs) are commitments to use specific resources for 1-3 years in exchange for significant discounts.\n\n' +
      '**Discount Levels:**\n' +
      '- 1-year commitment: ~25-35% off\n' +
      '- 3-year commitment: ~40-50% off\n\n' +
      '**Best For:**\n' +
      '- Production databases (RDS, GaussDB)\n' +
      '- Core application servers (ECS)\n' +
      '- Stable, predictable workloads\n\n' +
      '**Not Recommended For:**\n' +
      '- Development/testing environments\n' +
      '- Variable or temporary workloads',
    keywords: ['reserved', 'instance', 'commitment', 'discount', 'ri', 'prepay', 'annual', 'yearly', 'long-term'],
    category: 'optimization',
  },
  {
    id: 'opt-4',
    question: 'How do I identify idle resources?',
    answer: 'Idle resources are assets not being used but still incurring costs.\n\n' +
      '**Signs of Idle Resources:**\n' +
      '- **ECS:** <5% CPU for 14+ days\n' +
      '- **RDS:** Zero connections for 7+ days\n' +
      '- **EVS:** Volumes not attached to any instance\n' +
      '- **EIP:** Elastic IPs not bound to resources\n\n' +
      '**How to Find Them:**\n' +
      '1. Go to Resources page\n' +
      '2. Sort by utilization (low to high)\n' +
      '3. Check Recommendations for "idle_resource" type\n\n' +
      '**Action:** Terminate or snapshot and delete',
    keywords: ['idle', 'unused', 'inactive', 'waste', 'identify', 'find', 'detect', 'zombie', 'orphan'],
    category: 'optimization',
  },
  {
    id: 'opt-5',
    question: 'What are easy wins?',
    answer: 'Easy wins are optimization recommendations that are simple to implement with low risk.\n\n' +
      '**Characteristics:**\n' +
      '- **Effort:** Easy (few clicks, no downtime)\n' +
      '- **Risk:** Low (reversible, non-critical)\n' +
      '- **Savings:** Immediate impact\n\n' +
      '**Examples:**\n' +
      '- Deleting unattached storage volumes\n' +
      '- Releasing unused elastic IPs\n' +
      '- Removing old snapshots\n' +
      '- Downsizing non-production instances\n\n' +
      'Click "Implement Easy Wins" on the Recommendations page to apply all at once!',
    keywords: ['easy', 'win', 'quick', 'simple', 'fast', 'low risk', 'effort'],
    category: 'optimization',
  },
  // Resources
  {
    id: 'res-1',
    question: 'What is ECS?',
    answer: 'ECS (Elastic Cloud Server) is Huawei Cloud\'s virtual machine service.\n\n' +
      '**Features:**\n' +
      '- Scalable compute capacity (vCPUs, RAM)\n' +
      '- Multiple instance families (general, compute, memory optimized)\n' +
      '- Support for Linux and Windows\n' +
      '- Pay-per-hour billing\n\n' +
      '**Common Uses:**\n' +
      '- Web servers\n' +
      '- Application backends\n' +
      '- Development environments\n\n' +
      '**Tip:** ECS is typically your largest cost - monitor utilization closely!',
    keywords: ['ecs', 'elastic', 'cloud', 'server', 'compute', 'vm', 'virtual', 'machine', 'instance'],
    category: 'resources',
  },
  {
    id: 'res-2',
    question: 'What is the difference between OBS and EVS?',
    answer: '**OBS (Object Storage Service)**\n' +
      '- Stores unstructured data (files, images, backups)\n' +
      '- Accessed via HTTP/HTTPS APIs\n' +
      '- Unlimited capacity, pay per GB stored\n' +
      '- Best for: Archives, media, static websites\n\n' +
      '**EVS (Elastic Volume Service)**\n' +
      '- Block storage attached to ECS instances\n' +
      '- Works like a virtual hard drive\n' +
      '- Fixed capacity per volume\n' +
      '- Best for: Databases, applications, OS disks\n\n' +
      '**Cost Comparison:**\n' +
      'OBS is ~60% cheaper per GB but has API request costs.',
    keywords: ['obs', 'evs', 'storage', 'object', 'volume', 'block', 'difference', 'compare', 'vs'],
    category: 'resources',
  },
  {
    id: 'res-3',
    question: 'How do I view resource utilization?',
    answer: 'To view resource utilization:\n\n' +
      '**1. Go to Resources Page**\n' +
      '   Navigate using the sidebar menu\n\n' +
      '**2. View Metrics**\n' +
      '   Each resource shows:\n' +
      '   - CPU Utilization (%)\n' +
      '   - Memory Utilization (%)\n' +
      '   - Network I/O\n' +
      '   - Disk Usage\n\n' +
      '**3. Filter & Sort**\n' +
      '   - Filter by service type (ECS, RDS, etc.)\n' +
      '   - Sort by utilization to find inefficient resources\n\n' +
      '**Tip:** Resources under 30% utilization are candidates for rightsizing!',
    keywords: ['utilization', 'usage', 'cpu', 'memory', 'view', 'monitor', 'check', 'see', 'metrics'],
    category: 'resources',
  },
  {
    id: 'res-4',
    question: 'What is RDS?',
    answer: 'RDS (Relational Database Service) is a managed database service.\n\n' +
      '**Supported Databases:**\n' +
      '- MySQL\n' +
      '- PostgreSQL\n' +
      '- SQL Server\n' +
      '- MariaDB\n\n' +
      '**Benefits:**\n' +
      '- Automated backups\n' +
      '- High availability options\n' +
      '- Automatic patching\n' +
      '- Easy scaling\n\n' +
      '**Cost Factors:**\n' +
      '- Instance size (vCPUs, RAM)\n' +
      '- Storage capacity\n' +
      '- Backup storage\n' +
      '- Data transfer',
    keywords: ['rds', 'database', 'relational', 'mysql', 'postgresql', 'sql', 'db'],
    category: 'resources',
  },
  // Security
  {
    id: 'sec-1',
    question: 'How do I connect my Huawei Cloud account?',
    answer: 'To connect your Huawei Cloud account:\n\n' +
      '**Step 1:** Go to Settings > API Integration tab\n\n' +
      '**Step 2:** Get your credentials from Huawei Cloud Console:\n' +
      '   - Log into console.huaweicloud.com\n' +
      '   - Go to IAM > My Credentials\n' +
      '   - Create or copy Access Key (AK)\n' +
      '   - Copy Secret Key (SK)\n' +
      '   - Note your Project ID\n\n' +
      '**Step 3:** Enter credentials and click Connect\n\n' +
      '**Security:** We use encrypted connections (TLS 1.3) and never store your SK in plain text.',
    keywords: ['connect', 'api', 'credential', 'access', 'key', 'huawei', 'account', 'setup', 'integrate', 'link'],
    category: 'security',
  },
  {
    id: 'sec-2',
    question: 'Is my data secure?',
    answer: 'Yes! We implement comprehensive security measures:\n\n' +
      '**Data Protection:**\n' +
      '- TLS 1.3 encryption for all data in transit\n' +
      '- AES-256 encryption for data at rest\n' +
      '- No plain-text credential storage\n\n' +
      '**Access Control:**\n' +
      '- Role-based access (RBAC)\n' +
      '- Two-factor authentication available\n' +
      '- Session management\n\n' +
      '**Compliance:**\n' +
      '- Audit logging for all actions\n' +
      '- Regular security assessments\n\n' +
      'Your cloud credentials are used read-only for cost data retrieval.',
    keywords: ['secure', 'security', 'data', 'safe', 'protect', 'encrypt', 'privacy', 'compliance'],
    category: 'security',
  },
  // Dashboard & General
  {
    id: 'gen-1',
    question: 'How do I change the currency?',
    answer: 'To change the display currency:\n\n' +
      '**Method 1 - Header:**\n' +
      'Click the currency dropdown in the top-right header (shows flag + currency code like USD, GBP, NGN)\n\n' +
      '**Method 2 - Settings:**\n' +
      'Go to Settings > Preferences > Default Currency\n\n' +
      '**Available Currencies:**\n' +
      '- 🇺🇸 USD (US Dollar)\n' +
      '- 🇬🇧 GBP (British Pound)\n' +
      '- 🇪🇺 EUR (Euro)\n' +
      '- 🇯🇵 JPY (Japanese Yen)\n' +
      '- 🇨🇳 CNY (Chinese Yuan)\n' +
      '- 🇳🇬 NGN (Nigerian Naira)\n\n' +
      'All values are automatically converted using current exchange rates.',
    keywords: ['currency', 'change', 'usd', 'gbp', 'eur', 'ngn', 'cny', 'jpy', 'convert', 'naira', 'dollar', 'euro'],
    category: 'dashboard',
  },
  {
    id: 'gen-2',
    question: 'How do I filter by tenant?',
    answer: 'To filter data by tenant:\n\n' +
      '**Step 1:** Locate the tenant selector in the header (shows "All Tenants" by default)\n\n' +
      '**Step 2:** Click to open dropdown\n\n' +
      '**Step 3:** Select a specific tenant\n\n' +
      '**What Changes:**\n' +
      '- All cost data filters to selected tenant\n' +
      '- KPIs show tenant-specific metrics\n' +
      '- Recommendations filter to tenant\n' +
      '- Resources show only tenant assets\n\n' +
      '**Tip:** Select "All Tenants" to see aggregated data across your organization.',
    keywords: ['tenant', 'filter', 'select', 'switch', 'business', 'unit', 'organization', 'company'],
    category: 'dashboard',
  },
  {
    id: 'gen-3',
    question: 'How do I export reports?',
    answer: 'To export reports:\n\n' +
      '**Step 1:** Go to Reports page (sidebar menu)\n\n' +
      '**Step 2:** Choose report type:\n' +
      '- Cost Analysis\n' +
      '- Resource Utilization\n' +
      '- Recommendations\n' +
      '- Cost Allocation\n' +
      '- Budget vs Actual\n\n' +
      '**Step 3:** Click the download icon next to any report\n\n' +
      '**Formats:** CSV (Excel-compatible)\n\n' +
      '**Scheduling:** Set up automated reports (Daily/Weekly/Monthly) to receive regular updates.',
    keywords: ['export', 'report', 'download', 'csv', 'generate', 'excel', 'pdf'],
    category: 'dashboard',
  },
  {
    id: 'gen-4',
    question: 'What is the efficiency score?',
    answer: 'The efficiency score (0-100%) measures how well you\'re managing cloud resources.\n\n' +
      '**Factors:**\n' +
      '- **Resource Utilization** - Higher CPU/memory usage = better\n' +
      '- **Idle Resources** - Fewer idle assets = better\n' +
      '- **Implemented Optimizations** - More actions taken = better\n' +
      '- **Budget Adherence** - Staying within budget = better\n\n' +
      '**Score Ranges:**\n' +
      '- 🟢 85-100%: Excellent\n' +
      '- 🟡 70-84%: Good\n' +
      '- 🟠 50-69%: Needs improvement\n' +
      '- 🔴 Below 50%: Critical attention needed',
    keywords: ['efficiency', 'score', 'rating', 'performance', 'metric', 'grade', 'health'],
    category: 'dashboard',
  },
  {
    id: 'gen-5',
    question: 'How do I change the date range?',
    answer: 'To change the date range for analytics:\n\n' +
      '**Location:** Header bar, next to the currency selector\n\n' +
      '**Available Ranges:**\n' +
      '- Last 7 Days\n' +
      '- Last 30 Days\n' +
      '- Last 90 Days\n' +
      '- This Month\n' +
      '- Last Month\n\n' +
      '**What\'s Affected:**\n' +
      '- Cost trend charts\n' +
      '- Analytics data\n' +
      '- Service breakdowns\n\n' +
      'Note: KPIs always show month-to-date (MTD) regardless of date range selection.',
    keywords: ['date', 'range', 'period', 'time', 'days', 'month', 'filter', 'timeframe'],
    category: 'dashboard',
  },
  {
    id: 'gen-6',
    question: 'Where can I see service breakdown?',
    answer: 'Service breakdown is available in multiple locations:\n\n' +
      '**1. Dashboard (Home)**\n' +
      '   - Pie chart showing cost distribution\n' +
      '   - Top services by spend\n\n' +
      '**2. Analytics Page**\n' +
      '   - Detailed service cost table\n' +
      '   - Trend charts per service\n' +
      '   - Growth percentages\n\n' +
      '**3. Allocation Page**\n' +
      '   - Treemap visualization\n' +
      '   - Interactive cost breakdown\n\n' +
      'Filter by tenant to see specific organization\'s service usage.',
    keywords: ['service', 'breakdown', 'distribution', 'pie', 'chart', 'ecs', 'rds', 'category'],
    category: 'dashboard',
  },
];

const categoryIcons = {
  costs: TrendingUp,
  optimization: PiggyBank,
  resources: Server,
  security: Shield,
  general: HelpCircle,
  dashboard: HelpCircle,
};

const categoryColors = {
  costs: 'text-blue-500',
  optimization: 'text-emerald-500',
  resources: 'text-purple-500',
  security: 'text-red-500',
  general: 'text-amber-500',
  dashboard: 'text-amber-500',
};

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  followUp?: string[];
}

// =====================================================
// ENHANCED NLP FUNCTIONS
// =====================================================

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^\w\s'?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function expandSynonyms(words: string[]): string[] {
  const expanded = new Set(words);
  words.forEach(word => {
    Object.entries(synonyms).forEach(([key, syns]) => {
      if (word === key || syns.includes(word)) {
        expanded.add(key);
        syns.forEach(s => expanded.add(s));
      }
    });
  });
  return Array.from(expanded);
}

function checkIntentPatterns(query: string): string | null {
  const normalized = normalizeText(query);

  for (const { intent, patterns, response } of intentPatterns) {
    for (const pattern of patterns) {
      if (pattern.test(normalized) || pattern.test(query)) {
        return response || null;
      }
    }
  }
  return null;
}

function findMatchingFAQs(query: string): { faq: FAQItem; score: number }[] {
  const normalized = normalizeText(query);
  const words = normalized.split(/\s+/).filter(w => w.length > 2);
  const expandedWords = expandSynonyms(words);

  const scored = faqData.map(faq => {
    let score = 0;

    // Check keywords with expanded synonyms
    faq.keywords.forEach(keyword => {
      // Exact match in query
      if (normalized.includes(keyword)) score += 5;

      // Word overlap
      expandedWords.forEach(word => {
        if (keyword === word) score += 3;
        if (keyword.includes(word) || word.includes(keyword)) score += 1;
      });
    });

    // Check question similarity
    const questionNormalized = normalizeText(faq.question);
    const questionWords = questionNormalized.split(/\s+/);

    expandedWords.forEach(word => {
      if (questionNormalized.includes(word)) score += 2;
      questionWords.forEach(qWord => {
        if (qWord === word) score += 1;
      });
    });

    // Boost for question word matches (what, how, why, etc.)
    const questionStarters = ['what', 'how', 'why', 'where', 'when', 'can', 'do', 'does', 'is', 'are'];
    const queryStarter = words[0];
    const faqStarter = questionWords[0];
    if (questionStarters.includes(queryStarter) && queryStarter === faqStarter) {
      score += 2;
    }

    return { faq, score };
  });

  return scored
    .filter(s => s.score > 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function generateBotResponse(query: string): { content: string; followUp?: string[] } {
  // Check for intent patterns first (greetings, thanks, etc.)
  const intentResponse = checkIntentPatterns(query);
  if (intentResponse) {
    return { content: intentResponse };
  }

  // Find matching FAQs
  const matches = findMatchingFAQs(query);

  if (matches.length === 0) {
    return {
      content: "I'm not sure about that specific question, but I can help with:\n\n" +
        "**Try asking about:**\n" +
        "- \"How do I reduce costs?\"\n" +
        "- \"What is rightsizing?\"\n" +
        "- \"How do I change currency?\"\n" +
        "- \"What are reserved instances?\"\n" +
        "- \"How do I export reports?\"\n\n" +
        "Or type **help** to see everything I can assist with!",
      followUp: ['How do I reduce costs?', 'What can you help with?'],
    };
  }

  const bestMatch = matches[0].faq;

  // If high confidence match, return just that answer
  if (matches[0].score >= 8) {
    return {
      content: bestMatch.answer,
      followUp: bestMatch.followUp,
    };
  }

  // If moderate confidence, add related questions
  if (matches.length > 1 && matches[0].score < 8) {
    const relatedQuestions = matches
      .slice(1, 3)
      .map(m => m.faq.question);

    return {
      content: bestMatch.answer,
      followUp: relatedQuestions.length > 0 ? relatedQuestions : bestMatch.followUp,
    };
  }

  return {
    content: bestMatch.answer,
    followUp: bestMatch.followUp,
  };
}

// =====================================================
// CHATBOT COMPONENT
// =====================================================

export function FAQChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: 'bot',
      content: "Hi! I'm your FinOps Assistant. I can help you understand cloud costs, find optimization opportunities, and navigate this dashboard.\n\nWhat would you like to know?",
      timestamp: new Date(),
      followUp: ['How do I reduce costs?', 'What is MTD spend?', 'Show me optimization tips'],
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 400));

    const { content, followUp } = generateBotResponse(messageText);

    const botMessage: Message = {
      id: `bot-${Date.now()}`,
      type: 'bot',
      content,
      timestamp: new Date(),
      followUp,
    };

    setMessages(prev => [...prev, botMessage]);
    setIsTyping(false);
  };

  const handleReset = () => {
    setMessages([
      {
        id: 'welcome',
        type: 'bot',
        content: "Hi! I'm your FinOps Assistant. I can help you understand cloud costs, find optimization opportunities, and navigate this dashboard.\n\nWhat would you like to know?",
        timestamp: new Date(),
        followUp: ['How do I reduce costs?', 'What is MTD spend?', 'Show me optimization tips'],
      },
    ]);
  };

  const quickQuestions = [
    faqData.find(f => f.id === 'cost-3')!,
    faqData.find(f => f.id === 'opt-1')!,
    faqData.find(f => f.id === 'gen-1')!,
  ];

  return (
    <>
      {/* Chat Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
              onClick={() => setIsOpen(true)}
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[400px] h-[600px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">FinOps Assistant</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Online
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleReset}
                  title="Reset conversation"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div key={message.id}>
                    <div
                      className={cn(
                        "flex gap-3",
                        message.type === 'user' ? "flex-row-reverse" : ""
                      )}
                    >
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                          message.type === 'user'
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        {message.type === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div
                        className={cn(
                          "max-w-[280px] rounded-2xl px-4 py-2.5",
                          message.type === 'user'
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>

                    {/* Follow-up suggestions */}
                    {message.type === 'bot' && message.followUp && index === messages.length - 1 && (
                      <div className="ml-11 mt-2 space-y-1">
                        {message.followUp.map((q, i) => (
                          <button
                            key={i}
                            onClick={() => handleSend(q)}
                            className="block w-full text-left px-3 py-1.5 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors text-xs text-primary border border-primary/20"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Questions (shown only on welcome) */}
                {messages.length === 1 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Popular questions
                    </p>
                    {quickQuestions.map((faq) => {
                      const Icon = categoryIcons[faq.category];
                      return (
                        <button
                          key={faq.id}
                          onClick={() => handleSend(faq.question)}
                          className="w-full text-left px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm flex items-center gap-2"
                        >
                          <Icon className={cn("h-4 w-4 flex-shrink-0", categoryColors[faq.category])} />
                          <span className="line-clamp-1">{faq.question}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border bg-muted/30">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about costs, optimization..."
                  className="flex-1 bg-background"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isTyping}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                Type <span className="font-medium">help</span> to see all topics
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
