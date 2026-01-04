/**
 * Audit Logs Component
 */
import React, { useState, useEffect } from "react";
import { axios, API_URL, getAuthHeader, toast, Button, Skeleton, Eye } from "./shared";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => { fetchLogs(); }, [page]);

  const fetchLogs = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/audit-logs?page=${page}&limit=20`, { headers: getAuthHeader() });
      setLogs(response.data.logs);
      setTotal(response.data.total);
    } catch (error) {
      toast.error("فشل في تحميل السجلات");
    } finally {
      setLoading(false);
    }
  };

  const actionLabels = {
    update_order_status: "تحديث حالة طلب",
    deliver_order: "تسليم طلب",
    resolve_dispute: "حل نزاع",
    update_role: "تغيير دور",
    create_product: "إنشاء منتج",
    update_product: "تحديث منتج"
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="font-heading text-xl md:text-2xl font-bold">سجل النشاطات</h2>
      <p className="text-sm text-muted-foreground">سجل غير قابل للتعديل لجميع الإجراءات في النظام</p>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
      ) : logs.length > 0 ? (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="p-3 rounded-lg bg-card border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary"><Eye className="h-4 w-4" /></div>
                  <div>
                    <div className="font-medium text-sm">{actionLabels[log.action] || log.action}</div>
                    <div className="text-xs text-muted-foreground">بواسطة: {log.user_name} ({log.user_role})</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground text-left">
                  <div>{new Date(log.created_at).toLocaleDateString('ar-JO')}</div>
                  <div>{new Date(log.created_at).toLocaleTimeString('ar-JO')}</div>
                </div>
              </div>
              {log.changes && Object.keys(log.changes).length > 0 && (
                <div className="mt-2 p-2 rounded bg-secondary/50 text-xs font-mono" dir="ltr">
                  {JSON.stringify(log.changes, null, 2).slice(0, 100)}...
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground"><p>لا توجد سجلات</p></div>
      )}

      {total > 20 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>السابق</Button>
          <span className="px-4 py-2 text-sm">صفحة {page}</span>
          <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={logs.length < 20}>التالي</Button>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
