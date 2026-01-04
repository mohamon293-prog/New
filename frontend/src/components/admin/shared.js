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
} from "lucide-react";
