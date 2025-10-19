import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Bird, Plus, CalendarClock, Trash, Award, CheckCircle, XCircle, Clock, Weight, Dna, Palette, Pencil } from "lucide-react";
import { api } from "@/lib/api";
import { Rooster, CreateRoosterRequest } from "@shared/api";
import { toast } from "sonner";

export default function Gamefowl() {
  const [roosters, setRoosters] = useState<Rooster[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRooster, setEditingRooster] = useState<Rooster | null>(null);
  const [form, setForm] = useState<CreateRoosterRequest>({
    name: "",
    breed: "",
    ageMonths: undefined,
    weightGrams: undefined,
    color: "",
    gender: "",
    registrationNumber: "",
    bloodline: "",
    birthDate: "",
    acquisitionDate: "",
    status: "active",
    notes: "",
    avatarImageUrl: ""
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Load roosters from API on component mount
  useEffect(() => {
    loadRoosters();
  }, []);

  const loadRoosters = async () => {
    try {
      setLoading(true);
      const data = await api.getRoosters();
      setRoosters(data);
    } catch (error) {
      console.error('Failed to load roosters:', error);
      toast.error('Failed to load roosters');
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!form.name.trim()) return;
    
    try {
      setSaving(true);
      
      let avatarUrl = "";
      
      // Upload image if selected
      if (selectedImage) {
        try {
          const uploadResult = await api.uploadImage(selectedImage);
          avatarUrl = uploadResult.url;
        } catch (uploadError) {
          console.error('Failed to upload image:', uploadError);
          toast.error('Failed to upload image, but rooster will be saved without photo');
        }
      }
      
      // Create rooster with image URL
      const roosterData = { ...form, avatarImageUrl: avatarUrl };
      const newRooster = await api.createRooster(roosterData);
      
      setRoosters(prev => [...prev, newRooster]);
      setOpen(false);
      setForm({
        name: "",
        breed: "",
        ageMonths: undefined,
        weightGrams: undefined,
        color: "",
        gender: "",
        registrationNumber: "",
        bloodline: "",
        birthDate: "",
        acquisitionDate: "",
        status: "active",
        notes: "",
        avatarImageUrl: ""
      });
      setSelectedImage(null);
      setImagePreview("");
      toast.success('Rooster added successfully');
    } catch (error) {
      console.error('Failed to create rooster:', error);
      toast.error('Failed to add rooster');
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (rooster: Rooster) => {
    setEditingRooster(rooster);
    setForm({
      name: rooster.name,
      breed: rooster.breed || "",
      ageMonths: rooster.ageMonths,
      weightGrams: rooster.weightGrams,
      color: rooster.color || "",
      gender: rooster.gender || "",
      registrationNumber: rooster.registrationNumber || "",
      bloodline: rooster.bloodline || "",
      birthDate: rooster.birthDate || "",
      acquisitionDate: rooster.acquisitionDate || "",
      status: rooster.status || "active",
      notes: rooster.notes || "",
      avatarImageUrl: rooster.avatarImageUrl || ""
    });
    setImagePreview(rooster.avatarImageUrl || "");
    setOpen(true);
  };

  const update = async () => {
    if (!editingRooster || !form.name.trim()) return;
    
    try {
      setSaving(true);
      
      let avatarUrl = form.avatarImageUrl || "";
      
      // Upload new image if selected
      if (selectedImage) {
        try {
          const uploadResult = await api.uploadImage(selectedImage);
          avatarUrl = uploadResult.url;
        } catch (uploadError) {
          console.error('Failed to upload image:', uploadError);
          toast.error('Failed to upload image, but rooster will be updated without new photo');
        }
      }
      
      // Update rooster with image URL
      const roosterData = { ...form, avatarImageUrl: avatarUrl };
      const updatedRooster = await api.updateRooster(editingRooster.id, roosterData);
      
      setRoosters(prev => prev.map(r => r.id === editingRooster.id ? updatedRooster : r));
      setOpen(false);
      setEditingRooster(null);
      setForm({
        name: "",
        breed: "",
        ageMonths: undefined,
        weightGrams: undefined,
        color: "",
        gender: "",
        registrationNumber: "",
        bloodline: "",
        birthDate: "",
        acquisitionDate: "",
        status: "active",
        notes: "",
        avatarImageUrl: ""
      });
      setSelectedImage(null);
      setImagePreview("");
      toast.success('Rooster updated successfully');
    } catch (error) {
      console.error('Failed to update rooster:', error);
      toast.error('Failed to update rooster');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await api.deleteRooster(id);
      setRoosters(prev => prev.filter((r) => r.id !== id));
      toast.success('Rooster removed successfully');
    } catch (error) {
      console.error('Failed to delete rooster:', error);
      toast.error('Failed to remove rooster');
    }
  };

  const handleDialogClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingRooster(null);
      setForm({
        name: "",
        breed: "",
        ageMonths: undefined,
        weightGrams: undefined,
        color: "",
        gender: "",
        registrationNumber: "",
        bloodline: "",
        birthDate: "",
        acquisitionDate: "",
        status: "active",
        notes: "",
        avatarImageUrl: ""
      });
      setSelectedImage(null);
      setImagePreview("");
    }
  };

  const count = useMemo(() => roosters.length, [roosters]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">My Gamefowl</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Create profiles, attach scans, and track care routines.</p>
        </div>
        <Dialog open={open} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add Rooster
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editingRooster ? <Pencil className="h-5 w-5 text-primary" /> : <Bird className="h-5 w-5 text-primary" />}
                {editingRooster ? 'Edit Rooster' : 'New Rooster'}
              </DialogTitle>
              <DialogDescription>
                {editingRooster ? 'Update the details below to modify the rooster profile.' : 'Fill in the details below to create a profile for your rooster.'}
              </DialogDescription>
            </DialogHeader>
            <form
              className="grid gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                editingRooster ? update() : save();
              }}
            >
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Basic Information</h3>
                
                <div className="grid gap-1.5">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Red Ranger"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    autoFocus
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="breed">Breed</Label>
                    <Input
                      id="breed"
                      placeholder="e.g., Rhode Island Red"
                      value={form.breed}
                      onChange={(e) => setForm({ ...form, breed: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="gender">Gender</Label>
                    <select
                      id="gender"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="age">Age (months)</Label>
                    <Input
                      id="age"
                      type="number"
                      min={0}
                      value={form.ageMonths || ""}
                      onChange={(e) => setForm({ ...form, ageMonths: Number(e.target.value) || undefined })}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="weight">Weight (grams)</Label>
                    <Input
                      id="weight"
                      type="number"
                      min={0}
                      value={form.weightGrams || ""}
                      onChange={(e) => setForm({ ...form, weightGrams: Number(e.target.value) || undefined })}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      placeholder="e.g., Red, Black"
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Registration & Lineage */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Registration & Lineage</h3>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="registration">Registration Number</Label>
                    <Input
                      id="registration"
                      placeholder="e.g., RR-2024-001"
                      value={form.registrationNumber}
                      onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="bloodline">Bloodline</Label>
                    <Input
                      id="bloodline"
                      placeholder="e.g., Kelso, Hatch"
                      value={form.bloodline}
                      onChange={(e) => setForm({ ...form, bloodline: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="birthDate">Birth Date</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={form.birthDate}
                      onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="acquisitionDate">Acquisition Date</Label>
                    <Input
                      id="acquisitionDate"
                      type="date"
                      value={form.acquisitionDate}
                      onChange={(e) => setForm({ ...form, acquisitionDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="retired">Retired</option>
                    <option value="deceased">Deceased</option>
                  </select>
                </div>
              </div>

              {/* Avatar Image */}
              <div className="grid gap-1.5">
                <Label htmlFor="avatarImage">Avatar Image</Label>
                <div className="space-y-3">
                  <Input
                    id="avatarImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedImage(file);
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          setImagePreview(e.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {imagePreview && (
                    <div className="flex items-center gap-3">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-16 h-16 rounded-lg object-cover border"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview("");
                          const input = document.getElementById('avatarImage') as HTMLInputElement;
                          if (input) input.value = '';
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Optional: Upload a photo for the rooster's profile picture.</p>
              </div>

              {/* Notes */}
              <div className="grid gap-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Temperament, condition, lineage, health notes, etc."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">Add optional notes to help with care and tracking.</p>
              </div>

              <DialogFooter className="gap-2 sm:gap-3">
                <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!form.name.trim() || saving}>
                  {saving ? (editingRooster ? "Updating..." : "Saving...") : (editingRooster ? "Update" : "Save")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="rounded-xl border p-10 text-center text-muted-foreground">
          Loading roosters...
        </div>
      ) : roosters.length === 0 ? (
        <div className="rounded-xl border p-10 text-center text-muted-foreground">
          No roosters yet. Click "Add Rooster" to create your first profile.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roosters.map((r) => (
              <Card key={r.id}>
                <CardHeader className="flex flex-row items-center gap-3">
                  <Avatar>
                    {r.avatarImageUrl ? (
                      <AvatarImage 
                        src={r.avatarImageUrl} 
                        alt={r.name}
                        className="object-cover"
                      />
                    ) : null}
                    <AvatarFallback>
                      <Bird className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="leading-tight">{r.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{r.breed || "Unknown breed"}</p>
                  </div>
                  <Badge variant="secondary">{r.ageMonths ? `${r.ageMonths}m` : "Age N/A"}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Weight */}
                    {r.weightGrams && (
                      <div className="flex items-center gap-1.5 p-2 bg-muted/50 rounded-md">
                        <Weight className="h-3.5 w-3.5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Weight</p>
                          <p className="text-sm font-semibold">{(r.weightGrams / 1000).toFixed(2)}kg</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Color */}
                    {r.color && (
                      <div className="flex items-center gap-1.5 p-2 bg-muted/50 rounded-md">
                        <Palette className="h-3.5 w-3.5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Color</p>
                          <p className="text-sm font-semibold">{r.color}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Bloodline */}
                  {r.bloodline && (
                    <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-md border border-primary/10">
                      <Dna className="h-4 w-4 text-primary" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Bloodline</p>
                        <p className="text-sm font-medium">{r.bloodline}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Registration Number */}
                  {r.registrationNumber && (
                    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                      <Award className="h-4 w-4 text-primary" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Registration</p>
                        <p className="text-sm font-medium">{r.registrationNumber}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    {r.status === 'active' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {r.status === 'retired' && <Clock className="h-4 w-4 text-amber-600" />}
                    {r.status === 'deceased' && <XCircle className="h-4 w-4 text-red-600" />}
                    <Badge 
                      variant={r.status === 'active' ? 'default' : 'secondary'}
                      className={
                        r.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                        r.status === 'retired' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' :
                        'bg-red-100 text-red-800 hover:bg-red-100'
                      }
                    >
                      {r.status?.charAt(0).toUpperCase() + r.status?.slice(1) || 'Active'}
                    </Badge>
                  </div>
                  
                  {/* Notes */}
                  {r.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2 pt-2 border-t">
                      {r.notes}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarClock className="h-3.5 w-3.5" /> Last scan: —
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(r)} className="flex-1 sm:flex-none">
                      <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => remove(r.id)} className="flex-1 sm:flex-none">
                      <Trash className="mr-1 h-3.5 w-3.5" /> Remove
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">Total: {count}</p>
        </>
      )}
    </div>
  );
}
