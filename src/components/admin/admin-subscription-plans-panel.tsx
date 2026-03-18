'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Plus, Pencil, RefreshCw } from 'lucide-react';

type Plan = {
  id: string;
  name: string;
  description?: string | null;
  maxEvents?: number | null;
  maxTickets?: number | null;
  maxAccommodations?: number | null;
  maxCategories?: number | null;
  isActive: boolean;
  createdAt: string;
};

function numOrNull(v: string) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  if (n <= 0) return null;
  return Math.trunc(n);
}

export function AdminSubscriptionPlansPanel() {
  const [items, setItems] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    maxEvents: '',
    maxTickets: '',
    maxAccommodations: '',
    maxCategories: '',
    isActive: true,
  });

  const list = useMemo(() => items, [items]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await api.get<Plan[]>('/admin/subscription-plans', true);
    if (!res.success) {
      setError(res.error || 'Gagal memuat paket');
      setLoading(false);
      return;
    }
    setItems(res.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      description: '',
      maxEvents: '',
      maxTickets: '',
      maxAccommodations: '',
      maxCategories: '',
      isActive: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (p: Plan) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || '',
      maxEvents: p.maxEvents ? String(p.maxEvents) : '',
      maxTickets: p.maxTickets ? String(p.maxTickets) : '',
      maxAccommodations: p.maxAccommodations ? String(p.maxAccommodations) : '',
      maxCategories: p.maxCategories ? String(p.maxCategories) : '',
      isActive: p.isActive,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError(null);

    const payload: any = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      maxEvents: form.maxEvents.trim() ? numOrNull(form.maxEvents.trim()) : null,
      maxTickets: form.maxTickets.trim() ? numOrNull(form.maxTickets.trim()) : null,
      maxAccommodations: form.maxAccommodations.trim() ? numOrNull(form.maxAccommodations.trim()) : null,
      maxCategories: form.maxCategories.trim() ? numOrNull(form.maxCategories.trim()) : null,
      isActive: form.isActive,
    };

    if (!payload.name) {
      setSaving(false);
      return;
    }

    if (!editing) {
      const res = await api.post<Plan>('/admin/subscription-plans', payload, true);
      if (!res.success) {
        setError(res.error || 'Gagal membuat paket');
        setSaving(false);
        return;
      }
    } else {
      const res = await api.request<Plan>(`/admin/subscription-plans/${editing.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      if (!res.success) {
        setError(res.error || 'Gagal mengubah paket');
        setSaving(false);
        return;
      }
    }

    setDialogOpen(false);
    setEditing(null);
    setSaving(false);
    await fetchAll();
  };

  const toggleActive = async (p: Plan) => {
    const res = await api.request<Plan>(`/admin/subscription-plans/${p.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    if (!res.success) {
      setError(res.error || 'Gagal mengubah status paket');
      return;
    }
    await fetchAll();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Paket Subscription</h2>
          <p className="text-gray-500">Atur limit event/tiket/penginapan/kategori untuk vendor.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void fetchAll()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
          <Button onClick={openCreate} className="bg-blue-500 hover:bg-blue-600">
            <Plus className="mr-2 h-4 w-4" /> Tambah
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle>Daftar Paket</CardTitle>
          <CardDescription>Total: {list.length}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-gray-500">Memuat...</div>
          ) : list.length === 0 ? (
            <div className="text-sm text-gray-500">Belum ada paket</div>
          ) : (
            <div className="space-y-2">
              {list.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                    {p.description && <p className="text-xs text-gray-600 line-clamp-2">{p.description}</p>}
                    <p className="text-xs text-gray-500 mt-1">
                      Limit: event {p.maxEvents ?? '∞'}, tiket {p.maxTickets ?? '∞'}, penginapan {p.maxAccommodations ?? '∞'}, kategori {p.maxCategories ?? '∞'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={p.isActive} onCheckedChange={() => void toggleActive(p)} />
                    <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Paket' : 'Tambah Paket'}</DialogTitle>
            <DialogDescription>Isi limit. Kosongkan untuk unlimited.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Nama</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Deskripsi</Label>
              <Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Maks Event</Label>
                <Input inputMode="numeric" value={form.maxEvents} onChange={(e) => setForm((p) => ({ ...p, maxEvents: e.target.value }))} placeholder="contoh: 10" />
              </div>
              <div className="grid gap-2">
                <Label>Maks Tiket</Label>
                <Input inputMode="numeric" value={form.maxTickets} onChange={(e) => setForm((p) => ({ ...p, maxTickets: e.target.value }))} placeholder="contoh: 50" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Maks Penginapan</Label>
                <Input inputMode="numeric" value={form.maxAccommodations} onChange={(e) => setForm((p) => ({ ...p, maxAccommodations: e.target.value }))} placeholder="contoh: 5" />
              </div>
              <div className="grid gap-2">
                <Label>Maks Kategori (Vendor)</Label>
                <Input inputMode="numeric" value={form.maxCategories} onChange={(e) => setForm((p) => ({ ...p, maxCategories: e.target.value }))} placeholder="contoh: 3" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Aktif</p>
                <p className="text-xs text-gray-600">Nonaktif = tidak ditawarkan.</p>
              </div>
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Batal</Button>
            <Button onClick={() => void save()} className="bg-blue-500 hover:bg-blue-600" disabled={saving || !form.name.trim()}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminSubscriptionPlansPanel;

