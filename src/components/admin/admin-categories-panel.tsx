'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { slugify } from '@/lib/slug';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Pencil, RefreshCw } from 'lucide-react';

type CategoryType = 'EVENT' | 'ACCOMMODATION';

type Category = {
  id: string;
  name: string;
  slug: string;
  type: CategoryType | string;
  ownerKey: string;
  vendorId?: string | null;
  isActive: boolean;
  createdAt: string;
};

export function AdminCategoriesPanel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Category[]>([]);
  const [filterType, setFilterType] = useState<'all' | CategoryType>('all');
  const [filterOwner, setFilterOwner] = useState<'all' | 'GLOBAL' | 'VENDOR'>('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<{ name: string; type: CategoryType }>({ name: '', type: 'EVENT' });

  const filtered = useMemo(() => {
    return items.filter((c) => {
      const okType = filterType === 'all' ? true : c.type === filterType;
      const okOwner =
        filterOwner === 'all'
          ? true
          : filterOwner === 'GLOBAL'
            ? c.ownerKey === 'GLOBAL'
            : c.ownerKey !== 'GLOBAL';
      return okType && okOwner;
    });
  }, [items, filterOwner, filterType]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await api.get<Category[]>('/categories?includeInactive=true', true);
    if (!res.success) {
      setError(res.error || 'Gagal memuat kategori');
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
    setForm({ name: '', type: 'EVENT' });
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, type: (cat.type as CategoryType) || 'EVENT' });
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    if (!form.name.trim()) {
      setSaving(false);
      return;
    }

    if (!editing) {
      const res = await api.post<Category>('/categories', { name: form.name.trim(), type: form.type }, true);
      if (!res.success) {
        setError(res.error || 'Gagal membuat kategori');
        setSaving(false);
        return;
      }
    } else {
      const res = await api.request<Category>(`/categories/${editing.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: form.name.trim(), type: form.type }),
      });
      if (!res.success) {
        setError(res.error || 'Gagal mengubah kategori');
        setSaving(false);
        return;
      }
    }

    setDialogOpen(false);
    setEditing(null);
    setSaving(false);
    await fetchAll();
  };

  const toggleActive = async (cat: Category) => {
    const res = await api.request<Category>(`/categories/${cat.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !cat.isActive }),
    });
    if (!res.success) {
      setError(res.error || 'Gagal mengubah status kategori');
      return;
    }
    await fetchAll();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kelola Kategori</h2>
          <p className="text-gray-500">Kategori global untuk vendor pilih, dan kategori vendor (opsional).</p>
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

      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
          <CardDescription>Gunakan filter untuk melihat kategori tertentu.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Tipe</Label>
            <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="EVENT">Event</SelectItem>
                <SelectItem value="ACCOMMODATION">Penginapan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Owner</Label>
            <Select value={filterOwner} onValueChange={(v) => setFilterOwner(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="GLOBAL">Global</SelectItem>
                <SelectItem value="VENDOR">Vendor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle>Daftar Kategori</CardTitle>
          <CardDescription>
            Total: {filtered.length}. Slug otomatis: contoh <code>{slugify('Wisata Populer')}</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-gray-500">Memuat...</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-gray-500">Tidak ada data</div>
          ) : (
            <div className="space-y-2">
              {filtered.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                      <Badge variant="outline" className="text-xs">{String(c.type)}</Badge>
                      <Badge variant="secondary" className="text-xs">
                        {c.ownerKey === 'GLOBAL' ? 'GLOBAL' : 'VENDOR'}
                      </Badge>
                      {!c.isActive && <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">Nonaktif</Badge>}
                    </div>
                    <p className="text-xs text-gray-500">slug: {c.slug}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={c.isActive} onCheckedChange={() => void toggleActive(c)} />
                    <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle>
            <DialogDescription>Kategori global akan tersedia untuk semua vendor.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Tipe</Label>
              <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v as any }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EVENT">Event</SelectItem>
                  <SelectItem value="ACCOMMODATION">Penginapan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Nama</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
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

export default AdminCategoriesPanel;
