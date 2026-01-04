/**
 * Wallet Management Component
 */
import React, { useState, useEffect } from "react";
import {
  axios, API_URL, getAuthHeader, toast,
  Button, Input, Label, Badge, Skeleton,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Search, Plus, Wallet
} from "./shared";

const WalletManagement = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreditDialog, setShowCreditDialog] = useState(false);

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
      setLoadingUsers(false);
    }
  };

  const handleCredit = async (e) => {
    e.preventDefault();
    if (!selectedUser || !amount || !reason) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/admin/wallet/credit`, { 
        user_id: selectedUser.id, 
        amount: parseFloat(amount), 
        currency: "JOD", 
        reason 
      }, { headers: getAuthHeader() });
      toast.success(`تم شحن ${amount} د.أ لـ ${selectedUser.name}`);
      setShowCreditDialog(false);
      setSelectedUser(null);
      setAmount("");
      setReason("");
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في شحن المحفظة");
    } finally {
      setLoading(false);
    }
  };

  const openCreditDialog = (user) => {
    setSelectedUser(user);
    setAmount("");
    setReason("شحن يدوي من الإدارة");
    setShowCreditDialog(true);
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="font-heading text-xl md:text-2xl font-bold">إدارة المحافظ</h2>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث عن مستخدم بالاسم أو البريد..."
            className="pr-10 h-10"
          />
        </div>
      </div>

      {/* Users List */}
      {loadingUsers ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
      ) : filteredUsers.length > 0 ? (
        <div className="space-y-2">
          {filteredUsers.map((user) => (
            <div key={user.id} className="p-3 md:p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm truncate">{user.name}</h3>
                    <Badge className={user.role === "admin" ? "bg-purple-500" : "bg-blue-500"} >
                      {user.role === "admin" ? "مدير" : user.role === "employee" ? "موظف" : "مشتري"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="flex items-center gap-1">
                      <Wallet className="h-4 w-4 text-green-500" />
                      <strong className="text-green-500">{user.wallet_balance_jod?.toFixed(2) || "0.00"} د.أ</strong>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      انضم: {new Date(user.created_at).toLocaleDateString('ar-JO')}
                    </span>
                  </div>
                </div>
                <Button onClick={() => openCreditDialog(user)} className="h-9 gap-2 flex-shrink-0">
                  <Plus className="h-4 w-4" />
                  شحن
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? "لا توجد نتائج للبحث" : "لا يوجد مستخدمين"}
        </div>
      )}

      {/* Credit Dialog */}
      <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>شحن محفظة المستخدم</DialogTitle>
            <DialogDescription>
              {selectedUser?.name} - {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCredit} className="space-y-4">
            <div className="p-3 rounded-lg bg-secondary/50">
              <div className="text-sm text-muted-foreground">الرصيد الحالي</div>
              <div className="text-2xl font-bold text-green-500">
                {selectedUser?.wallet_balance_jod?.toFixed(2) || "0.00"} د.أ
              </div>
            </div>
            <div>
              <Label>المبلغ المراد إضافته (د.أ)</Label>
              <Input 
                type="number" 
                step="0.01" 
                min="0.01"
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="10.00" 
                className="mt-1.5 h-10 text-lg font-bold"
                dir="ltr"
                required
              />
            </div>
            <div>
              <Label>السبب</Label>
              <Input 
                value={reason} 
                onChange={(e) => setReason(e.target.value)} 
                placeholder="شحن يدوي..." 
                className="mt-1.5 h-10"
                required
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCreditDialog(false)}>إلغاء</Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? "جاري الشحن..." : <>
                  <Plus className="h-4 w-4" /> شحن المحفظة
                </>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WalletManagement;
