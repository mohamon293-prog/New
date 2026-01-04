/**
 * Users Management Component
 */
import React, { useState, useEffect } from "react";
import {
  axios, API_URL, getAuthHeader, toast,
  Button, Input, Badge, Skeleton,
  Search, CheckCircle, XCircle
} from "./shared";

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  const filteredUsers = users.filter(
    (user) => user.name?.toLowerCase().includes(search.toLowerCase()) || user.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="font-heading text-xl md:text-2xl font-bold">إدارة المستخدمين</h2>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 h-10" />
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
      ) : (
        <div className="space-y-2">
          {filteredUsers.map((user) => (
            <div key={user.id} className="p-3 md:p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm md:text-base truncate">{user.name}</p>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {user.role === "admin" ? "مدير" : user.role === "support" ? "دعم فني" : user.role === "moderator" ? "مشرف" : "مشتري"}
                    </Badge>
                    {user.is_active ? (
                      <Badge className="bg-green-500 text-xs">نشط</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">معطل</Badge>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0" onClick={() => toggleUserStatus(user.id, user.is_active)}>
                  {user.is_active ? <XCircle className="h-5 w-5 text-destructive" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
