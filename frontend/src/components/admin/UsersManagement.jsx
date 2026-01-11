/**
 * Users Management Component with Roles & Permissions
 */
import React, { useState, useEffect } from "react";
import {
  axios, API_URL, getAuthHeader, toast,
  Button, Input, Badge, Skeleton,
  Search, CheckCircle, XCircle
} from "./shared";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Wallet, Plus, Minus, Shield, Settings, User, Crown } from "lucide-react";

// Available roles
const ROLES = [
  { id: "buyer", label: "مشتري", level: 1, color: "bg-gray-500", icon: User },
  { id: "support", label: "دعم فني", level: 50, color: "bg-blue-500", icon: Settings },
  { id: "moderator", label: "مشرف", level: 75, color: "bg-purple-500", icon: Shield },
  { id: "admin", label: "مدير", level: 100, color: "bg-red-500", icon: Crown },
];

// Available permissions
const PERMISSIONS = [
  { id: "manage_products", label: "إدارة المنتجات" },
  { id: "manage_orders", label: "إدارة الطلبات" },
  { id: "manage_users", label: "إدارة المستخدمين" },
  { id: "manage_wallet", label: "إدارة المحفظة" },
  { id: "manage_disputes", label: "إدارة النزاعات" },
  { id: "view_analytics", label: "عرض التحليلات" },
  { id: "manage_settings", label: "إدارة الإعدادات" },
  { id: "manage_cms", label: "إدارة المحتوى" },
];

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Wallet dialog
  const [walletDialog, setWalletDialog] = useState(null);
  const [walletAmount, setWalletAmount] = useState("");
  const [walletNotes, setWalletNotes] = useState("");
  const [walletAction, setWalletAction] = useState("credit");
  
  // Role dialog
  const [roleDialog, setRoleDialog] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/users`, { headers: getAuthHeader() });
      setUsers(response.data);
    } catch (error) {
      toast.error("فشل في تحميل المستخدمين");
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await axios.patch(`${API_URL}/admin/users/${userId}`, { is_active: !currentStatus }, { headers: getAuthHeader() });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_active: !currentStatus } : u));
      toast.success("تم تحديث حالة المستخدم");
    } catch (error) {
      toast.error("فشل في تحديث المستخدم");
    }
  };

  // Open wallet dialog
  const openWalletDialog = (user, action) => {
    setWalletDialog(user);
    setWalletAction(action);
    setWalletAmount("");
    setWalletNotes("");
  };

  // Handle wallet action
  const handleWalletAction = async () => {
    if (!walletDialog || !walletAmount || parseFloat(walletAmount) <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح");
      return;
    }

    setProcessing(true);
    try {
      const endpoint = walletAction === "credit" ? "/wallet/admin/credit" : "/wallet/admin/deduct";
      const response = await axios.post(
        `${API_URL}${endpoint}`,
        {
          user_id: walletDialog.id,
          amount: parseFloat(walletAmount),
          notes: walletNotes
        },
        { headers: getAuthHeader() }
      );

      toast.success(response.data.message);
      
      setUsers((prev) => prev.map((u) => 
        u.id === walletDialog.id 
          ? { ...u, wallet_balance: response.data.new_balance, wallet_balance_jod: response.data.new_balance }
          : u
      ));
      
      setWalletDialog(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في تنفيذ العملية");
    } finally {
      setProcessing(false);
    }
  };

  // Open role dialog
  const openRoleDialog = (user) => {
    setRoleDialog(user);
    setSelectedRole(user.role || "buyer");
    setSelectedPermissions(user.permissions || []);
  };

  // Handle role update
  const handleRoleUpdate = async () => {
    if (!roleDialog) return;
    
    setProcessing(true);
    try {
      await axios.patch(
        `${API_URL}/admin/users/${roleDialog.id}/role`,
        {
          role: selectedRole,
          permissions: selectedPermissions
        },
        { headers: getAuthHeader() }
      );

      toast.success("تم تحديث صلاحيات المستخدم");
      
      setUsers((prev) => prev.map((u) => 
        u.id === roleDialog.id 
          ? { ...u, role: selectedRole, permissions: selectedPermissions }
          : u
      ));
      
      setRoleDialog(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في تحديث الصلاحيات");
    } finally {
      setProcessing(false);
    }
  };

  // Toggle permission
  const togglePermission = (permId) => {
    setSelectedPermissions(prev => 
      prev.includes(permId) 
        ? prev.filter(p => p !== permId)
        : [...prev, permId]
    );
  };

  const filteredUsers = users.filter(
    (user) => user.name?.toLowerCase().includes(search.toLowerCase()) || user.email?.toLowerCase().includes(search.toLowerCase())
  );

  const formatBalance = (user) => {
    const balance = user.wallet_balance_jod || user.wallet_balance || 0;
    return `${balance.toFixed(2)} د.أ`;
  };

  const getRoleBadge = (role) => {
    const roleInfo = ROLES.find(r => r.id === role) || ROLES[0];
    const Icon = roleInfo.icon;
    return (
      <Badge className={`${roleInfo.color} gap-1`}>
        <Icon className="h-3 w-3" />
        {roleInfo.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="font-heading text-xl md:text-2xl font-bold">إدارة المستخدمين</h2>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 h-10" />
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
      ) : (
        <div className="space-y-2">
          {filteredUsers.map((user) => (
            <div key={user.id} className="p-3 md:p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm md:text-base truncate">{user.name}</p>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">{user.email}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {getRoleBadge(user.role)}
                    {user.is_active ? (
                      <Badge className="bg-green-500 text-xs">نشط</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">معطل</Badge>
                    )}
                    <Badge variant="outline" className="text-xs bg-primary/10">
                      <Wallet className="h-3 w-3 ml-1" />
                      {formatBalance(user)}
                    </Badge>
                    {user.permissions?.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {user.permissions.length} صلاحية
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {/* Role Button */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 text-purple-500 hover:text-purple-600 hover:bg-purple-500/10"
                    onClick={() => openRoleDialog(user)}
                    title="الأدوار والصلاحيات"
                  >
                    <Shield className="h-5 w-5" />
                  </Button>
                  {/* Credit Button */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                    onClick={() => openWalletDialog(user, "credit")}
                    title="شحن المحفظة"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                  {/* Deduct Button */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
                    onClick={() => openWalletDialog(user, "deduct")}
                    title="خصم من المحفظة"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  {/* Status Toggle */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 flex-shrink-0" 
                    onClick={() => toggleUserStatus(user.id, user.is_active)}
                  >
                    {user.is_active ? <XCircle className="h-5 w-5 text-destructive" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Wallet Dialog */}
      <Dialog open={!!walletDialog} onOpenChange={() => setWalletDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              {walletAction === "credit" ? "شحن المحفظة" : "خصم من المحفظة"}
            </DialogTitle>
            <DialogDescription>
              {walletDialog && (
                <span>
                  المستخدم: <strong>{walletDialog.name}</strong>
                  <br />
                  الرصيد الحالي: <strong className="text-primary">{formatBalance(walletDialog)}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>المبلغ (د.أ)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={walletAmount}
                onChange={(e) => setWalletAmount(e.target.value)}
                placeholder="0.00"
                dir="ltr"
              />
            </div>
            <div>
              <Label>ملاحظات (اختياري)</Label>
              <Textarea
                value={walletNotes}
                onChange={(e) => setWalletNotes(e.target.value)}
                placeholder="سبب الشحن أو الخصم..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWalletDialog(null)}>إلغاء</Button>
            <Button 
              onClick={handleWalletAction} 
              disabled={processing}
              className={walletAction === "credit" ? "bg-green-500 hover:bg-green-600" : "bg-orange-500 hover:bg-orange-600"}
            >
              {processing ? "جاري التنفيذ..." : walletAction === "credit" ? "شحن" : "خصم"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role & Permissions Dialog */}
      <Dialog open={!!roleDialog} onOpenChange={() => setRoleDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-500" />
              الأدوار والصلاحيات
            </DialogTitle>
            <DialogDescription>
              {roleDialog && (
                <span>تعديل صلاحيات: <strong>{roleDialog.name}</strong></span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Role Selection */}
            <div>
              <Label className="mb-2 block">الدور</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الدور" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => {
                    const Icon = role.icon;
                    return (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{role.label}</span>
                          <span className="text-xs text-muted-foreground">(مستوى {role.level})</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Permissions */}
            <div>
              <Label className="mb-2 block">الصلاحيات الإضافية</Label>
              <div className="grid grid-cols-2 gap-2">
                {PERMISSIONS.map((perm) => (
                  <label
                    key={perm.id}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedPermissions.includes(perm.id)
                        ? "bg-primary/20 border border-primary/50"
                        : "bg-secondary/50 hover:bg-secondary"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(perm.id)}
                      onChange={() => togglePermission(perm.id)}
                      className="rounded"
                    />
                    <span className="text-sm">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Role Description */}
            <div className="p-3 rounded-lg bg-secondary/50 text-sm">
              <p className="font-bold mb-1">وصف الأدوار:</p>
              <ul className="space-y-1 text-muted-foreground text-xs">
                <li><strong>مشتري:</strong> يمكنه الشراء فقط</li>
                <li><strong>دعم فني:</strong> يمكنه إدارة الطلبات والنزاعات</li>
                <li><strong>مشرف:</strong> يمكنه إدارة المنتجات والمحتوى</li>
                <li><strong>مدير:</strong> صلاحيات كاملة</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialog(null)}>إلغاء</Button>
            <Button onClick={handleRoleUpdate} disabled={processing} className="bg-purple-500 hover:bg-purple-600">
              {processing ? "جاري الحفظ..." : "حفظ الصلاحيات"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersManagement;
