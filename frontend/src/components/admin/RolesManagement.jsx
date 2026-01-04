/**
 * Roles Management Component
 */
import React, { useState, useEffect } from "react";
import {
  axios, API_URL, getAuthHeader, toast,
  Button, Badge, Skeleton,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Settings, CheckCircle
} from "./shared";

const RolesManagement = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [rolesRes, permsRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/admin/roles`, { headers: getAuthHeader() }),
        axios.get(`${API_URL}/admin/permissions`, { headers: getAuthHeader() }),
        axios.get(`${API_URL}/admin/users`, { headers: getAuthHeader() })
      ]);
      setRoles(rolesRes.data);
      setPermissions(permsRes.data);
      setUsers(usersRes.data.filter(u => u.role !== "buyer"));
    } catch (error) {
      toast.error("فشل في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    try {
      const response = await axios.get(`${API_URL}/admin/users/${user.id}/permissions`, { headers: getAuthHeader() });
      setUserPermissions(response.data.custom_permissions || []);
    } catch (error) {
      toast.error("فشل في تحميل صلاحيات المستخدم");
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await axios.put(`${API_URL}/admin/users/${userId}/role`, { role: newRole }, { headers: getAuthHeader() });
      toast.success("تم تحديث الدور");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في تحديث الدور");
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await axios.put(`${API_URL}/admin/users/${selectedUser.id}/permissions`, { permissions: userPermissions }, { headers: getAuthHeader() });
      toast.success("تم حفظ الصلاحيات");
      setSelectedUser(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في حفظ الصلاحيات");
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (permId) => {
    setUserPermissions(prev => prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]);
  };

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl md:text-2xl font-bold">إدارة الأدوار والصلاحيات</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map(role => (
          <div key={role.id} className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${role.level >= 100 ? 'bg-purple-500' : role.level >= 50 ? 'bg-blue-500' : role.level >= 30 ? 'bg-green-500' : 'bg-gray-500'}`} />
              <h3 className="font-bold">{role.name}</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{role.description}</p>
            <div className="flex flex-wrap gap-1">
              {role.permissions?.slice(0, 3).map(p => (
                <Badge key={p} variant="outline" className="text-xs">{permissions.find(x => x.id === p)?.name || p}</Badge>
              ))}
              {(role.permissions?.length || 0) > 3 && (
                <Badge variant="secondary" className="text-xs">+{role.permissions.length - 3}</Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-card border border-border">
        <h3 className="font-bold text-lg mb-4">👥 أعضاء الفريق</h3>
        {users.length > 0 ? (
          <div className="space-y-2">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-bold">{user.name?.[0] || "U"}</span>
                  </div>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={user.role} onValueChange={(v) => handleUpdateRole(user.id, v)}>
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {roles.filter(r => r.id !== "buyer").map(role => (
                        <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => handleSelectUser(user)}>
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">لا يوجد أعضاء فريق حالياً</p>
        )}
      </div>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>صلاحيات مخصصة</DialogTitle>
            <DialogDescription>{selectedUser?.name} - {selectedUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">اختر صلاحيات إضافية لهذا المستخدم</p>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {permissions.map(perm => (
                <div key={perm.id} onClick={() => togglePermission(perm.id)} className={`p-2 rounded-lg cursor-pointer border transition-colors ${userPermissions.includes(perm.id) ? 'bg-primary/20 border-primary' : 'bg-secondary/50 border-transparent hover:border-border'}`}>
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`h-4 w-4 ${userPermissions.includes(perm.id) ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-sm">{perm.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>إلغاء</Button>
            <Button onClick={handleSavePermissions} disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RolesManagement;
