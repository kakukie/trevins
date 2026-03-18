'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Loader2, MoreVertical, Plus, Pencil, Trash2, RefreshCw, X } from 'lucide-react';

type Accommodation = {
  id: string;
  vendorId: string;
  name: string;
  slug: string;
  description?: string | null;
  type: string;
  address?: string | null;
  city?: string | null;
  images: string;
  facilities?: string | null;
  totalRooms: number;
  availableRooms: number;
  pricePerNight: number;
  discountPrice?: number | null;
  isActive: boolean;
  isFeatured: boolean;
  _count?: { rooms: number; bookings: number; reviews: number };
  rooms?: Room[];
};

type Room = {
  id: string;
  accommodationId: string;
  name: string;
  description?: string | null;
  pricePerNight: number;
  discountPrice?: number | null;
  capacity: number;
  isActive: boolean;
};

function parseJsonArray(input: string): string[] {
  try {
    const v = JSON.parse(input);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function VendorAccommodationsPanel() {
  const [items, setItems] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Accommodation | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'HOTEL',
    address: '',
    city: '',
    totalRooms: '10',
    pricePerNight: '200000',
    discountPrice: '',
    isFeatured: false,
    isActive: true,
    images: [] as string[],
    facilities: '',
  });

  const [roomsDialogOpen, setRoomsDialogOpen] = useState(false);
  const [roomsTarget, setRoomsTarget] = useState<Accommodation | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [roomEditing, setRoomEditing] = useState<Room | null>(null);
  const [roomForm, setRoomForm] = useState({
    name: '',
    description: '',
    pricePerNight: '200000',
    discountPrice: '',
    capacity: '2',
    isActive: true,
  });

  const maxImages = 5;
  const maxBytes = 2 * 1024 * 1024;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await api.get<Accommodation[]>('/vendor/accommodations', true);
    if (!res.success) {
      setError(res.error || 'Gagal memuat penginapan');
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
      type: 'HOTEL',
      address: '',
      city: '',
      totalRooms: '10',
      pricePerNight: '200000',
      discountPrice: '',
      isFeatured: false,
      isActive: true,
      images: [],
      facilities: '',
    });
    setDialogOpen(true);
  };

  const openEdit = (a: Accommodation) => {
    setEditing(a);
    setForm({
      name: a.name,
      description: a.description || '',
      type: a.type,
      address: a.address || '',
      city: a.city || '',
      totalRooms: String(a.totalRooms),
      pricePerNight: String(a.pricePerNight),
      discountPrice: a.discountPrice ? String(a.discountPrice) : '',
      isFeatured: a.isFeatured,
      isActive: a.isActive,
      images: parseJsonArray(a.images),
      facilities: (() => {
        try {
          const f = a.facilities ? JSON.parse(a.facilities) : [];
          return Array.isArray(f) ? f.join(', ') : '';
        } catch {
          return a.facilities || '';
        }
      })(),
    });
    setDialogOpen(true);
  };

  const handleImagesUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).slice(0, maxImages).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > maxBytes) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        if (!result) return;
        setForm((p) => ({ ...p, images: [...p.images, result].slice(0, maxImages) }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImageAt = (index: number) => {
    setForm((p) => ({ ...p, images: p.images.filter((_, i) => i !== index) }));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    const payload: any = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      type: form.type,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      images: form.images,
      facilities: form.facilities
        ? form.facilities.split(',').map((s) => s.trim()).filter(Boolean)
        : null,
      totalRooms: Number(form.totalRooms),
      pricePerNight: Number(form.pricePerNight),
      discountPrice: form.discountPrice.trim() ? Number(form.discountPrice) : null,
      isFeatured: form.isFeatured,
      isActive: form.isActive,
    };

    if (!payload.name || !Number.isFinite(payload.totalRooms) || !Number.isFinite(payload.pricePerNight)) {
      setSaving(false);
      setError('Mohon isi data wajib (nama, total kamar, harga).');
      return;
    }

    if (!editing) {
      const res = await api.post<Accommodation>('/accommodations', payload, true);
      if (!res.success) {
        setError(res.error || 'Gagal membuat penginapan');
        setSaving(false);
        return;
      }
    } else {
      const res = await api.put<Accommodation>(`/accommodations/${editing.id}`, payload, true);
      if (!res.success) {
        setError(res.error || 'Gagal mengubah penginapan');
        setSaving(false);
        return;
      }
    }

    setDialogOpen(false);
    setEditing(null);
    setSaving(false);
    await fetchAll();
  };

  const remove = async (a: Accommodation) => {
    if (!confirm(`Nonaktifkan penginapan "${a.name}"?`)) return;
    const res = await api.delete(`/accommodations/${a.id}`, true);
    if (!res.success) {
      setError(res.error || 'Gagal menghapus');
      return;
    }
    await fetchAll();
  };

  const openRooms = async (a: Accommodation) => {
    setRoomsTarget(a);
    setRoomsDialogOpen(true);
    const res = await api.get<Room[]>(`/accommodations/${a.id}/rooms`, true);
    setRooms(res.success && res.data ? res.data : []);
  };

  const openCreateRoom = () => {
    setRoomEditing(null);
    setRoomForm({ name: '', description: '', pricePerNight: '200000', discountPrice: '', capacity: '2', isActive: true });
    setRoomDialogOpen(true);
  };

  const openEditRoom = (r: Room) => {
    setRoomEditing(r);
    setRoomForm({
      name: r.name,
      description: r.description || '',
      pricePerNight: String(r.pricePerNight),
      discountPrice: r.discountPrice ? String(r.discountPrice) : '',
      capacity: String(r.capacity),
      isActive: r.isActive,
    });
    setRoomDialogOpen(true);
  };

  const saveRoom = async () => {
    if (!roomsTarget) return;
    const payload: any = {
      name: roomForm.name.trim(),
      description: roomForm.description.trim() || null,
      pricePerNight: Number(roomForm.pricePerNight),
      discountPrice: roomForm.discountPrice.trim() ? Number(roomForm.discountPrice) : null,
      capacity: Number(roomForm.capacity),
      isActive: roomForm.isActive,
    };
    if (!payload.name || !Number.isFinite(payload.pricePerNight) || !Number.isFinite(payload.capacity)) return;

    if (!roomEditing) {
      const res = await api.post(`/accommodations/${roomsTarget.id}/rooms`, payload, true);
      if (!res.success) {
        setError(res.error || 'Gagal membuat kamar');
        return;
      }
    } else {
      const res = await api.put(`/rooms/${roomEditing.id}`, payload, true);
      if (!res.success) {
        setError(res.error || 'Gagal mengubah kamar');
        return;
      }
    }

    setRoomDialogOpen(false);
    setRoomEditing(null);
    const res2 = await api.get<Room[]>(`/accommodations/${roomsTarget.id}/rooms`, true);
    setRooms(res2.success && res2.data ? res2.data : []);
  };

  const removeRoom = async (r: Room) => {
    if (!confirm(`Nonaktifkan kamar "${r.name}"?`)) return;
    const res = await api.delete(`/rooms/${r.id}`, true);
    if (!res.success) {
      setError(res.error || 'Gagal menghapus kamar');
      return;
    }
    if (roomsTarget) {
      const res2 = await api.get<Room[]>(`/accommodations/${roomsTarget.id}/rooms`, true);
      setRooms(res2.success && res2.data ? res2.data : []);
    }
  };

  const prettyType = useMemo(() => {
    return (t: string) => t;
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kelola Penginapan</h2>
          <p className="text-gray-500">CRUD penginapan dan kamar untuk booking.</p>
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <Card><CardContent className="p-6 text-sm text-gray-500">Memuat...</CardContent></Card>
        ) : items.length === 0 ? (
          <Card><CardContent className="p-6 text-sm text-gray-500">Belum ada penginapan</CardContent></Card>
        ) : (
          items.map((a) => {
            const imgs = parseJsonArray(a.images);
            const cover = imgs[0] || '/images/placeholder-accommodation.jpg';
            return (
              <Card key={a.id} className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                <div className="h-40 w-full bg-gray-100 overflow-hidden">
                  <img src={cover} alt={a.name} className="h-full w-full object-cover" />
                </div>
                <CardHeader className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{a.name}</CardTitle>
                      <CardDescription className="truncate">{a.city || '-'}</CardDescription>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">{prettyType(a.type)}</Badge>
                        {!a.isActive && <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">Nonaktif</Badge>}
                        {a.isFeatured && <Badge className="text-xs bg-orange-500">Featured</Badge>}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(a)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void openRooms(a)}>
                          <Plus className="mr-2 h-4 w-4" /> Kelola Kamar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={() => void remove(a)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Nonaktifkan
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold">Rp {a.discountPrice || a.pricePerNight} / malam</p>
                    <p className="text-xs text-gray-500">Kamar: {a._count?.rooms ?? a.rooms?.length ?? 0} · Booking: {a._count?.bookings ?? 0}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Penginapan' : 'Tambah Penginapan'}</DialogTitle>
            <DialogDescription>Tambahkan penginapan agar user bisa booking.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Nama *</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Deskripsi</Label>
              <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Tipe</Label>
                <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOTEL">HOTEL</SelectItem>
                    <SelectItem value="VILLA">VILLA</SelectItem>
                    <SelectItem value="HOMESTAY">HOMESTAY</SelectItem>
                    <SelectItem value="KOS">KOS</SelectItem>
                    <SelectItem value="RESORT">RESORT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Kota</Label>
                <Input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Alamat</Label>
              <Input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
            </div>

            <div className="grid gap-2">
              <Label>Gambar (opsional)</Label>
              <Input type="file" accept="image/*" multiple onChange={(e) => handleImagesUpload(e.target.files)} />
              {form.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {form.images.map((src, idx) => (
                    <div key={idx} className="relative rounded-lg border border-gray-200 bg-white overflow-hidden">
                      <img src={src} alt={`Img ${idx + 1}`} className="h-24 w-full object-cover" />
                      <button
                        type="button"
                        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center hover:bg-white"
                        onClick={() => removeImageAt(idx)}
                      >
                        <X className="h-4 w-4 text-gray-700" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500">Local testing: disimpan sebagai data URL.</p>
            </div>

            <div className="grid gap-2">
              <Label>Fasilitas (comma separated)</Label>
              <Input value={form.facilities} onChange={(e) => setForm((p) => ({ ...p, facilities: e.target.value }))} placeholder="WiFi, Pool, Parking" />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label>Total Kamar *</Label>
                <Input inputMode="numeric" value={form.totalRooms} onChange={(e) => setForm((p) => ({ ...p, totalRooms: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Harga / malam *</Label>
                <Input inputMode="numeric" value={form.pricePerNight} onChange={(e) => setForm((p) => ({ ...p, pricePerNight: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Harga Diskon</Label>
                <Input inputMode="numeric" value={form.discountPrice} onChange={(e) => setForm((p) => ({ ...p, discountPrice: e.target.value }))} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Featured</p>
                  <p className="text-xs text-gray-600">Muncul di rekomendasi.</p>
                </div>
                <Switch checked={form.isFeatured} onCheckedChange={(v) => setForm((p) => ({ ...p, isFeatured: v }))} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Aktif</p>
                  <p className="text-xs text-gray-600">Nonaktif = tidak tampil publik.</p>
                </div>
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Batal</Button>
            <Button onClick={() => void save()} className="bg-blue-500 hover:bg-blue-600" disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={roomsDialogOpen} onOpenChange={setRoomsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kelola Kamar</DialogTitle>
            <DialogDescription>{roomsTarget ? roomsTarget.name : ''}</DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-2">
            <Button onClick={openCreateRoom} className="bg-blue-500 hover:bg-blue-600">
              <Plus className="mr-2 h-4 w-4" /> Tambah Kamar
            </Button>
          </div>

          <div className="space-y-2 mt-4">
            {rooms.length === 0 ? (
              <p className="text-sm text-gray-500">Belum ada kamar</p>
            ) : (
              rooms.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{r.name}</p>
                    <p className="text-xs text-gray-600">Rp {r.discountPrice || r.pricePerNight} · Kapasitas {r.capacity}</p>
                    {!r.isActive && <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 mt-1">Nonaktif</Badge>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => openEditRoom(r)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => void removeRoom(r)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRoomsDialogOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{roomEditing ? 'Edit Kamar' : 'Tambah Kamar'}</DialogTitle>
            <DialogDescription>Minimal 1 kamar aktif untuk bisa dibooking.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Nama *</Label>
              <Input value={roomForm.name} onChange={(e) => setRoomForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Deskripsi</Label>
              <Textarea value={roomForm.description} onChange={(e) => setRoomForm((p) => ({ ...p, description: e.target.value }))} rows={3} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Harga / malam *</Label>
                <Input inputMode="numeric" value={roomForm.pricePerNight} onChange={(e) => setRoomForm((p) => ({ ...p, pricePerNight: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Harga Diskon</Label>
                <Input inputMode="numeric" value={roomForm.discountPrice} onChange={(e) => setRoomForm((p) => ({ ...p, discountPrice: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Kapasitas *</Label>
                <Input inputMode="numeric" value={roomForm.capacity} onChange={(e) => setRoomForm((p) => ({ ...p, capacity: e.target.value }))} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Aktif</p>
                </div>
                <Switch checked={roomForm.isActive} onCheckedChange={(v) => setRoomForm((p) => ({ ...p, isActive: v }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoomDialogOpen(false)}>Batal</Button>
            <Button onClick={() => void saveRoom()} className="bg-blue-500 hover:bg-blue-600" disabled={!roomForm.name.trim()}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default VendorAccommodationsPanel;

