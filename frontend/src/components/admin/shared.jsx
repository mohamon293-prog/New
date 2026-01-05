/**
 * Shared utilities and imports for Admin components
 */
import axios from "axios";
import { API_URL, getAuthHeader, formatPrice, formatDate } from "../../lib/utils";

export { axios, API_URL, getAuthHeader, formatPrice, formatDate };

// Re-export UI components
export { Button } from "../../components/ui/button";
export { Input } from "../../components/ui/input";
export { Label } from "../../components/ui/label";
export { Badge } from "../../components/ui/badge";
export { Skeleton } from "../../components/ui/skeleton";
export { Textarea } from "../../components/ui/textarea";
export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
export { toast } from "sonner";

// Icons
export {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Wallet,
  Tag,
  Bell,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  DollarSign,
  ShoppingBag,
  Gamepad2,
  Upload,
  Send,
  ChevronLeft,
  Home,
  Image,
  LayoutGrid,
  Settings,
  GripVertical,
  Calendar,
  Link as LinkIcon,
  FileSpreadsheet,
  AlertTriangle,
  Clock,
  RefreshCw,
  Filter,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Copy,
  ExternalLink,
  Download,
  File,
  Shield,
  Key,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  Activity,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Star,
  Heart,
  Globe,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Percent,
  Gift,
  Zap,
  Save,
  RotateCcw,
  HelpCircle,
  Info,
  AlertCircle,
  CheckSquare,
  Square,
  Circle,
  ToggleLeft,
  ToggleRight,
  Layers,
  Grid,
  List,
  Maximize,
  Minimize,
} from "lucide-react";

// Common Order Status Labels and Colors
export const ORDER_STATUSES = {
  pending_payment: { label: "في انتظار الدفع", color: "bg-yellow-500" },
  payment_failed: { label: "فشل الدفع", color: "bg-red-500" },
  processing: { label: "قيد المعالجة", color: "bg-blue-500" },
  awaiting_admin: { label: "في انتظار الإدارة", color: "bg-orange-500" },
  completed: { label: "مكتمل", color: "bg-green-500" },
  delivered: { label: "تم التسليم", color: "bg-green-600" },
  cancelled: { label: "ملغي", color: "bg-gray-500" },
  refunded: { label: "مسترد", color: "bg-purple-500" },
  disputed: { label: "نزاع مفتوح", color: "bg-red-600" }
};

// Product Type Labels
export const PRODUCT_TYPE_LABELS = { 
  digital_code: "كود رقمي", 
  existing_account: "حساب موجود", 
  new_account: "حساب جديد" 
};

export const PRODUCT_TYPE_COLORS = { 
  digital_code: "bg-blue-500", 
  existing_account: "bg-purple-500", 
  new_account: "bg-orange-500" 
};
