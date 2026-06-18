import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Edit,
  Eye,
  EyeOff,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Sprout,
  Trash2,
  Upload,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Textarea } from '../ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { cn } from '../../lib/utils';
import { getImageUrl, handleImageError } from '../../lib/imageUtils';
import { fileUploadService } from '../../services/fileUploadService';
import { producerService, type Producer, type ProducerCreateUpdateDto, type ProducerSectionSettings } from '../../services/producerService';

const emptyProducerForm: ProducerCreateUpdateDto = {
  slug: '',
  name: '',
  nameAr: '',
  description: '',
  descriptionAr: '',
  logoPath: '',
  websiteUrl: '',
  isActive: true,
  isDisplayedOnHomepage: true,
  displayOrder: 0,
};

const defaultSectionSettings: ProducerSectionSettings = {
  isEnabled: true,
  title: 'OUR COFFEE PRODUCERS',
  backgroundColor: '#111813',
  textColor: '#f8f4ec',
  accentColor: '#c89b63',
  marqueeSpeedSeconds: 24,
  singleLogoSpeedSeconds: 11,
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return fallback;
};

const getStatusDotClassName = (isActive: boolean) =>
  isActive
    ? 'bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.14)]'
    : 'bg-slate-300 shadow-[0_0_0_4px_rgba(148,163,184,0.16)]';

const normalizeSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const ProducersManagement: React.FC = () => {
  const [producers, setProducers] = useState<Producer[]>([]);
  const [sectionSettings, setSectionSettings] = useState<ProducerSectionSettings>(defaultSectionSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProducer, setEditingProducer] = useState<Producer | null>(null);
  const [form, setForm] = useState<ProducerCreateUpdateDto>(emptyProducerForm);

  const loadData = async () => {
    try {
      setLoading(true);
      const [producerList, settings] = await Promise.all([
        producerService.getAll(true),
        producerService.getSectionSettings(),
      ]);
      setProducers(producerList);
      setSectionSettings({ ...defaultSectionSettings, ...settings });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load producers'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredProducers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const filtered = query
      ? producers.filter((producer) =>
          producer.name.toLowerCase().includes(query) ||
          producer.slug.toLowerCase().includes(query) ||
          (producer.nameAr || '').toLowerCase().includes(query)
        )
      : producers;

    return [...filtered].sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
  }, [producers, searchTerm]);

  const openCreateDialog = () => {
    setEditingProducer(null);
    setForm({
      ...emptyProducerForm,
      displayOrder: producers.length,
    });
    setIsEditorOpen(true);
  };

  const openEditDialog = (producer: Producer) => {
    setEditingProducer(producer);
    setForm({
      slug: producer.slug,
      name: producer.name,
      nameAr: producer.nameAr || '',
      description: producer.description || '',
      descriptionAr: producer.descriptionAr || '',
      logoPath: producer.logoPath || '',
      websiteUrl: producer.websiteUrl || '',
      isActive: producer.isActive,
      isDisplayedOnHomepage: producer.isDisplayedOnHomepage,
      displayOrder: producer.displayOrder,
    });
    setIsEditorOpen(true);
  };

  const updateForm = <K extends keyof ProducerCreateUpdateDto>(key: K, value: ProducerCreateUpdateDto[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateSectionSettings = <K extends keyof ProducerSectionSettings>(key: K, value: ProducerSectionSettings[K]) => {
    setSectionSettings((current) => ({ ...current, [key]: value }));
  };

  const handleNameChange = (value: string) => {
    setForm((current) => ({
      ...current,
      name: value,
      slug: current.slug || normalizeSlug(value),
    }));
  };

  const handleSaveProducer = async () => {
    const payload: ProducerCreateUpdateDto = {
      ...form,
      slug: normalizeSlug(form.slug),
      name: form.name.trim(),
      nameAr: form.nameAr?.trim() || null,
      description: form.description?.trim() || null,
      descriptionAr: form.descriptionAr?.trim() || null,
      logoPath: form.logoPath?.trim() || null,
      websiteUrl: form.websiteUrl?.trim() || null,
      displayOrder: Number(form.displayOrder) || 0,
    };

    if (!payload.slug || !payload.name) {
      toast.error('Producer name and slug are required');
      return;
    }

    setSaving(true);
    try {
      if (editingProducer) {
        await producerService.update(editingProducer.id, payload);
        toast.success('Producer updated');
      } else {
        await producerService.create(payload);
        toast.success('Producer created');
      }

      setIsEditorOpen(false);
      await loadData();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to save producer'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProducer = async (producer: Producer) => {
    try {
      await producerService.delete(producer.id);
      toast.success('Producer deleted');
      await loadData();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete producer'));
    }
  };

  const handleSetActive = async (producer: Producer, isActive: boolean) => {
    try {
      await producerService.setActive(producer.id, isActive);
      toast.success(isActive ? 'Producer activated' : 'Producer deactivated');
      await loadData();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update producer status'));
    }
  };

  const handleSaveSectionSettings = async () => {
    setSaving(true);
    try {
      const saved = await producerService.updateSectionSettings(sectionSettings);
      setSectionSettings({ ...defaultSectionSettings, ...saved });
      toast.success('Producer section settings saved');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to save producer section settings'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    const validation = fileUploadService.validateFile(file, 5);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid logo file');
      return;
    }

    setUploading(true);
    try {
      const result = await fileUploadService.uploadFile(file, 'producers', 'image', 'producer-logo');
      if (!result.success || !result.fileUrl) {
        throw new Error(result.message || 'Logo upload failed');
      }
      updateForm('logoPath', result.fileUrl);
      toast.success('Logo uploaded');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to upload logo'));
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading producers</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sprout className="h-6 w-6" />
            <span>Producers</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search producers"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full sm:max-w-sm"
              />
            </div>
            <Button onClick={openCreateDialog} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add producer
            </Button>
          </div>

          <div className="md:hidden space-y-3">
            {filteredProducers.length === 0 ? (
              <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
                No producers found
              </div>
            ) : (
              filteredProducers.map((producer) => (
                <div
                  key={producer.id}
                  className={cn('rounded-lg border bg-card p-4', !producer.isActive && 'bg-muted/30 opacity-75')}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-muted">
                      {producer.logoPath ? (
                        <img
                          src={getImageUrl(producer.logoPath)}
                          alt={producer.name}
                          className="h-full w-full object-contain"
                          onError={(event) => handleImageError(event, '/images/placeholder.jpg')}
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 font-semibold">
                        <span className={cn('inline-block h-2.5 w-2.5 rounded-full', getStatusDotClassName(producer.isActive))} />
                        <span className="truncate">{producer.name}</span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{producer.slug}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon-sm" aria-label="Producer actions">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openEditDialog(producer)}>
                          <Edit className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleSetActive(producer, !producer.isActive)}>
                          {producer.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          {producer.isActive ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={(event) => event.preventDefault()}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete producer?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will delete "{producer.name}" from the producer list.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => handleDeleteProducer(producer)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Homepage</span>
                    {producer.isDisplayedOnHomepage ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[34%]">Producer</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-center">Homepage</TableHead>
                  <TableHead className="text-center">Order</TableHead>
                  <TableHead className="w-24 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No producers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducers.map((producer) => (
                    <TableRow key={producer.id} className={!producer.isActive ? 'bg-muted/30 text-muted-foreground' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md border bg-muted">
                            {producer.logoPath ? (
                              <img
                                src={getImageUrl(producer.logoPath)}
                                alt={producer.name}
                                className="h-full w-full object-contain"
                                onError={(event) => handleImageError(event, '/images/placeholder.jpg')}
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 font-medium">
                              <span className={cn('inline-block h-2.5 w-2.5 rounded-full', getStatusDotClassName(producer.isActive))} />
                              <span className="truncate">{producer.name}</span>
                            </div>
                            <p className="truncate text-xs text-muted-foreground">{producer.nameAr || '-'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{producer.slug}</TableCell>
                      <TableCell className="text-center">
                        {producer.isDisplayedOnHomepage ? (
                          <Eye className="h-4 w-4 text-green-600 mx-auto" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm">{producer.displayOrder}</TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Producer actions">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => openEditDialog(producer)}>
                              <Edit className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleSetActive(producer, !producer.isActive)}>
                              {producer.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              {producer.isActive ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onSelect={(event) => event.preventDefault()}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete producer?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will delete "{producer.name}" from the producer list.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => handleDeleteProducer(producer)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Homepage producer section</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label>Show section</Label>
              <p className="text-xs text-muted-foreground">Controls the producer strip on the homepage.</p>
            </div>
            <Switch
              checked={sectionSettings.isEnabled}
              onCheckedChange={(checked) => updateSectionSettings('isEnabled', checked)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="producer-section-title">Title</Label>
            <Input
              id="producer-section-title"
              value={sectionSettings.title}
              onChange={(event) => updateSectionSettings('title', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="producer-section-bg">Background color</Label>
            <Input
              id="producer-section-bg"
              value={sectionSettings.backgroundColor}
              onChange={(event) => updateSectionSettings('backgroundColor', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="producer-section-text">Text color</Label>
            <Input
              id="producer-section-text"
              value={sectionSettings.textColor}
              onChange={(event) => updateSectionSettings('textColor', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="producer-section-accent">Accent color</Label>
            <Input
              id="producer-section-accent"
              value={sectionSettings.accentColor}
              onChange={(event) => updateSectionSettings('accentColor', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="producer-section-speed">Marquee speed</Label>
            <Input
              id="producer-section-speed"
              type="number"
              min={6}
              max={90}
              value={sectionSettings.marqueeSpeedSeconds}
              onChange={(event) => updateSectionSettings('marqueeSpeedSeconds', Number(event.target.value))}
            />
          </div>
          <div className="md:col-span-2 xl:col-span-3">
            <Button onClick={handleSaveSectionSettings} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save section settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingProducer ? 'Edit producer' : 'Add producer'}</DialogTitle>
            <DialogDescription>Manage the producer details shown in the homepage producer section.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="producer-name">Name</Label>
              <Input
                id="producer-name"
                value={form.name}
                onChange={(event) => handleNameChange(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="producer-slug">Slug</Label>
              <Input
                id="producer-slug"
                value={form.slug}
                onChange={(event) => updateForm('slug', normalizeSlug(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="producer-name-ar">Arabic name</Label>
              <Input
                id="producer-name-ar"
                value={form.nameAr || ''}
                onChange={(event) => updateForm('nameAr', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="producer-website">Website URL</Label>
              <Input
                id="producer-website"
                value={form.websiteUrl || ''}
                onChange={(event) => updateForm('websiteUrl', event.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="producer-logo">Logo path</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="producer-logo"
                  value={form.logoPath || ''}
                  onChange={(event) => updateForm('logoPath', event.target.value)}
                  placeholder="/uploads/images/producers/logo.webp"
                />
                <Button asChild variant="outline" className="shrink-0">
                  <label>
                    {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleLogoUpload}
                      disabled={uploading}
                    />
                  </label>
                </Button>
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="producer-description">Description</Label>
              <Textarea
                id="producer-description"
                value={form.description || ''}
                onChange={(event) => updateForm('description', event.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="producer-description-ar">Arabic description</Label>
              <Textarea
                id="producer-description-ar"
                value={form.descriptionAr || ''}
                onChange={(event) => updateForm('descriptionAr', event.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="producer-order">Display order</Label>
              <Input
                id="producer-order"
                type="number"
                min={0}
                value={form.displayOrder}
                onChange={(event) => updateForm('displayOrder', Number(event.target.value))}
              />
            </div>
            <div className="grid gap-3 rounded-md border p-3">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="producer-active">Active</Label>
                <Switch
                  id="producer-active"
                  checked={form.isActive}
                  onCheckedChange={(checked) => updateForm('isActive', checked)}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="producer-homepage">Show on homepage</Label>
                <Switch
                  id="producer-homepage"
                  checked={form.isDisplayedOnHomepage}
                  onCheckedChange={(checked) => updateForm('isDisplayedOnHomepage', checked)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditorOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProducer} disabled={saving || uploading}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save producer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProducersManagement;
