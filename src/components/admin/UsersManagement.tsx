import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Separator } from '../ui/separator';
import {
  Users, Edit, Trash2, Search, Loader2, Key, UserCheck, UserX,
  MoreHorizontal, ChevronLeft, ChevronRight, Download, ArrowUpDown, ArrowUp, ArrowDown,
  Mail, Phone, Calendar, Shield, Clock, Hash, Eye, CheckCircle, XCircle,
  Copy, RefreshCw, UserPlus
} from 'lucide-react';
import { userService } from '../../services/userService';
import { getProfilePictureUrl } from '../../lib/profileUtils';
import type { User, UserCreateDto, UserUpdateDto, Role, PasswordUpdateDto } from '../../services/userService';

// ─── Helpers ────────────────────────────────────────────────────────────────

const getInitials = (name?: string, username?: string) => {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  if (username) return username.charAt(0).toUpperCase();
  return 'U';
};

const formatDate = (dateString?: string) => {
  if (!dateString) return null;
  try {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return null; }
};

const formatDateTime = (dateString?: string) => {
  if (!dateString) return null;
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  } catch { return null; }
};

const getRelativeTime = (dateString?: string) => {
  if (!dateString) return null;
  try {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    const diffMonth = Math.floor(diffDay / 30);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 30) return `${diffDay}d ago`;
    if (diffMonth < 12) return `${diffMonth}mo ago`;
    return `${Math.floor(diffMonth / 12)}y ago`;
  } catch { return null; }
};

const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text).catch(() => {}); };

// ─── Component ──────────────────────────────────────────────────────────────

export const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [formData, setFormData] = useState<UserCreateDto>({
    username: '',
    password: '',
    displayName: '',
    email: '',
    phoneNumber: '',
    isActive: true,
    roles: []
  });

  const [passwordData, setPasswordData] = useState<PasswordUpdateDto>({
    newPassword: '',
    forceSignOut: true
  });

  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadData();
  }, [currentPage, searchTerm, statusFilter, pageSize]);

  useEffect(() => {
    loadRoles();
  }, []);

  const showMessage = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const loadRoles = async () => {
    try {
      const rolesData = await userService.getRoles();
      setRoles(rolesData);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const loadData = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const usersData = await userService.getAll({
        page: currentPage,
        pageSize,
        searchTerm: searchTerm || undefined,
        isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
      });

      setUsers(usersData.items);
      setTotalCount(usersData.totalCount);
      const calculatedTotalPages = Math.ceil(usersData.totalCount / pageSize);
      setTotalPages(calculatedTotalPages || 1);
    } catch (error) {
      console.error('Error loading users:', error);
      showMessage('Error loading users list', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      displayName: '',
      email: '',
      phoneNumber: '',
      isActive: true,
      roles: []
    });
    setIsDialogOpen(true);
  };

  const handleEditUser = async (userId: number) => {
    try {
      const user = await userService.getById(userId);
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '',
        displayName: user.displayName || user.fullName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        isActive: user.isActive,
        roles: user.roles || []
      });
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error loading user:', error);
      showMessage('Error loading user data', 'error');
    }
  };

  const handleViewDetail = async (userId: number) => {
    try {
      const user = await userService.getById(userId);
      setDetailUser(user);
      setIsDetailOpen(true);
    } catch (error) {
      console.error('Error loading user details:', error);
      showMessage('Error loading user details', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (editingUser) {
        const updateData: UserUpdateDto = {
          username: formData.username,
          displayName: formData.displayName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          isActive: formData.isActive,
          roles: formData.roles
        };
        await userService.update(editingUser.id, updateData);
        showMessage('User updated successfully', 'success');
      } else {
        await userService.create(formData);
        showMessage('User created successfully', 'success');
      }
      setIsDialogOpen(false);
      await loadData();
    } catch (error: any) {
      console.error('Error saving user:', error);
      showMessage(error.response?.data?.message || 'Error saving user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await userService.delete(userId);
      showMessage('User deleted successfully', 'success');
      await loadData();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      showMessage(error.response?.data?.message || 'Error deleting user', 'error');
    }
  };

  const handleToggleActive = async (userId: number, currentStatus: boolean) => {
    try {
      await userService.updateStatus(userId, { isActive: !currentStatus });
      showMessage(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`, 'success');
      await loadData();
    } catch (error) {
      console.error('Error toggling user status:', error);
      showMessage('Error updating user status', 'error');
    }
  };

  const handleOpenPasswordDialog = (user: User) => {
    setSelectedUser(user);
    setPasswordData({ newPassword: '', forceSignOut: true });
    setConfirmPassword('');
    setIsPasswordDialogOpen(true);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== confirmPassword) {
      showMessage('Passwords do not match!', 'error');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      showMessage('Password must be at least 6 characters!', 'error');
      return;
    }
    if (!selectedUser) return;

    setSubmitting(true);
    try {
      await userService.updatePassword(selectedUser.id, passwordData);
      setIsPasswordDialogOpen(false);
      setSelectedUser(null);
      showMessage('Password updated successfully!', 'success');
    } catch (error: any) {
      console.error('Error updating password:', error);
      showMessage(error.response?.data?.message || 'Error updating password', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRole = (roleName: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles?.includes(roleName)
        ? prev.roles.filter(r => r !== roleName)
        : [...(prev.roles || []), roleName]
    }));
  };

  // ── Sorting ──────────────────────────────────────────────────────────────

  const handleColumnClick = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-3.5 w-3.5 ml-1 inline opacity-40" />;
    return sortDirection === 'asc'
      ? <ArrowUp className="h-3.5 w-3.5 ml-1 inline text-primary" />
      : <ArrowDown className="h-3.5 w-3.5 ml-1 inline text-primary" />;
  };

  const sortedUsers = useMemo(() => {
    let filtered = [...users];
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.roles?.includes(roleFilter));
    }
    if (sortColumn) {
      filtered.sort((a, b) => {
        let aVal: any, bVal: any;
        switch (sortColumn) {
          case 'id': aVal = a.id; bVal = b.id; break;
          case 'username': aVal = a.username.toLowerCase(); bVal = b.username.toLowerCase(); break;
          case 'email': aVal = (a.email || '').toLowerCase(); bVal = (b.email || '').toLowerCase(); break;
          case 'displayName':
            aVal = (a.displayName || a.fullName || '').toLowerCase();
            bVal = (b.displayName || b.fullName || '').toLowerCase(); break;
          case 'phoneNumber': aVal = a.phoneNumber || ''; bVal = b.phoneNumber || ''; break;
          case 'status': aVal = a.isActive ? 1 : 0; bVal = b.isActive ? 1 : 0; break;
          case 'roles':
            aVal = (a.roles || []).join(',').toLowerCase();
            bVal = (b.roles || []).join(',').toLowerCase(); break;
          case 'memberSince':
            aVal = a.memberSince ? new Date(a.memberSince).getTime() : 0;
            bVal = b.memberSince ? new Date(b.memberSince).getTime() : 0; break;
          case 'lastLogin':
            aVal = a.lastLoggedIn ? new Date(a.lastLoggedIn).getTime() : 0;
            bVal = b.lastLoggedIn ? new Date(b.lastLoggedIn).getTime() : 0; break;
          default: return 0;
        }
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [users, roleFilter, sortColumn, sortDirection]);

  // ── Stats ────────────────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    total: totalCount,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
    withPhone: users.filter(u => u.phoneNumber).length,
    withEmail: users.filter(u => u.email).length,
    admins: users.filter(u => u.roles?.some(r => r.toLowerCase() === 'admin')).length,
  }), [users, totalCount]);

  // ── Export ──────────────────────────────────────────────────────────────

  const exportToExcel = () => {
    try {
      const headers = ['#', 'Username', 'Display Name', 'Email', 'Phone', 'Status', 'Roles', 'Member Since', 'Last Login', 'User ID'];
      const rows = sortedUsers.map((user, idx) => [
        (idx + 1).toString(),
        user.username,
        user.displayName || user.fullName || '',
        user.email || '',
        user.phoneNumber || '',
        user.isActive ? 'Active' : 'Inactive',
        user.roles?.join(', ') || 'No roles',
        user.memberSince ? new Date(user.memberSince).toLocaleDateString() : '',
        user.lastLoggedIn ? new Date(user.lastLoggedIn).toLocaleString() : 'Never',
        user.id.toString()
      ]);
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => {
          const s = String(cell);
          return (s.includes(',') || s.includes('"') || s.includes('\n')) ? '"' + s.replace(/"/g, '""') + '"' : s;
        }).join(','))
      ].join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.setAttribute('href', URL.createObjectURL(blob));
      link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showMessage(`Exported ${sortedUsers.length} users successfully`, 'success');
    } catch (error) {
      console.error('Export error:', error);
      showMessage('Export failed. Please try again.', 'error');
    }
  };

  const getRoleBadgeStyle = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'admin': return 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-100';
      case 'manager': return 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-100';
      case 'editor': return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-100';
      case 'vip': return 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-200 ring-1 ring-gray-100';
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium">Loading users...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Users', value: stats.total, icon: Users, color: 'blue' },
            { label: 'Active', value: stats.active, icon: UserCheck, color: 'emerald' },
            { label: 'Inactive', value: stats.inactive, icon: UserX, color: 'orange' },
            { label: 'Admins', value: stats.admins, icon: Shield, color: 'violet' },
            { label: 'With Phone', value: stats.withPhone, icon: Phone, color: 'green' },
            { label: 'With Email', value: stats.withEmail, icon: Mail, color: 'pink' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className={`border-0 shadow-sm bg-gradient-to-br from-${color}-50 to-white`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-${color}-100`}>
                    <Icon className={`h-5 w-5 text-${color}-600`} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold text-${color}-700`}>{value}</p>
                    <p className={`text-xs text-${color}-500 font-medium`}>{label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Users Management</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">{totalCount} users total</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={() => loadData(true)} disabled={refreshing} variant="outline" size="sm" className="gap-1.5">
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button onClick={exportToExcel} disabled={loading || users.length === 0} variant="outline" size="sm" className="gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  Export
                </Button>
                <Button onClick={handleCreateUser} size="sm" className="gap-1.5">
                  <UserPlus className="h-3.5 w-3.5" />
                  Add User
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Message */}
            {message && (
              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${
                message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {message.type === 'success' && <CheckCircle className="h-4 w-4 flex-shrink-0" />}
                {message.type === 'error' && <XCircle className="h-4 w-4 flex-shrink-0" />}
                {message.text}
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
              <div className="relative flex-1 min-w-0 w-full lg:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, phone..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-9 h-9"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[120px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[100px] h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 / page</SelectItem>
                    <SelectItem value="20">20 / page</SelectItem>
                    <SelectItem value="50">50 / page</SelectItem>
                    <SelectItem value="100">100 / page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-3">
              {sortedUsers.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed p-8 text-center text-sm text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  No users found
                </div>
              ) : (
                sortedUsers.map((user) => (
                  <Card key={user.id} className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      <div className="flex items-start gap-3 p-4">
                        <div className="relative flex-shrink-0">
                          <Avatar className="h-12 w-12 ring-2 ring-background shadow-sm">
                            <AvatarImage src={getProfilePictureUrl(user.profilePicture)} alt={user.displayName || user.username} className="object-cover" />
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold">
                              {getInitials(user.displayName || user.fullName, user.username)}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${user.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-semibold text-sm truncate">{user.displayName || user.fullName || user.username}</span>
                            <span className="text-xs text-muted-foreground">#{user.id}</span>
                          </div>
                          <div className="text-xs text-muted-foreground truncate">@{user.username}</div>
                          <div className="mt-2 space-y-1">
                            {user.email && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{user.email}</span>
                              </div>
                            )}
                            {user.phoneNumber && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{user.phoneNumber}</span>
                              </div>
                            )}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {user.roles && user.roles.length > 0 ? (
                              user.roles.map((role) => (
                                <Badge key={role} variant="outline" className={`text-[10px] px-1.5 py-0 ${getRoleBadgeStyle(role)}`}>{role}</Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-xs">Member</span>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onSelect={() => handleViewDetail(user.id)}><Eye className="h-4 w-4" /> View Details</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleEditUser(user.id)}><Edit className="h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleOpenPasswordDialog(user)}><Key className="h-4 w-4" /> Change Password</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => handleToggleActive(user.id, user.isActive)}>
                              {user.isActive ? <UserX className="h-4 w-4 text-orange-500" /> : <UserCheck className="h-4 w-4 text-green-500" />}
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>Are you sure you want to delete "{user.username}"? This cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center justify-between gap-2 px-4 py-2 bg-muted/30 border-t text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(user.memberSince) || formatDate(user.lastLoggedIn) || 'N/A'}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{user.lastLoggedIn ? getRelativeTime(user.lastLoggedIn) : 'Never'}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block w-full min-w-0 max-w-full rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/60 select-none min-w-[250px]" onClick={() => handleColumnClick('displayName')}>
                      User {getSortIcon('displayName')}
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/60 select-none" onClick={() => handleColumnClick('email')}>
                      <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email {getSortIcon('email')}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/60 select-none" onClick={() => handleColumnClick('phoneNumber')}>
                      <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Phone {getSortIcon('phoneNumber')}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/60 select-none" onClick={() => handleColumnClick('roles')}>
                      Roles {getSortIcon('roles')}
                    </TableHead>
                    <TableHead className="text-center cursor-pointer hover:bg-muted/60 select-none" onClick={() => handleColumnClick('status')}>
                      Status {getSortIcon('status')}
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/60 select-none" onClick={() => handleColumnClick('memberSince')}>
                      <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Joined {getSortIcon('memberSince')}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/60 select-none" onClick={() => handleColumnClick('lastLogin')}>
                      <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Last Login {getSortIcon('lastLogin')}</div>
                    </TableHead>
                    <TableHead className="text-center w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                        <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No users found</p>
                        <p className="text-xs mt-1">Try adjusting your search or filters</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedUsers.map((user, idx) => (
                      <TableRow key={user.id} className="group hover:bg-muted/30 transition-colors">
                        <TableCell className="text-center text-xs text-muted-foreground font-mono">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative flex-shrink-0">
                              <Avatar className="h-10 w-10 ring-1 ring-border shadow-sm">
                                <AvatarImage src={getProfilePictureUrl(user.profilePicture)} alt={user.displayName || user.username} className="object-cover" />
                                <AvatarFallback className="bg-gradient-to-br from-primary/15 to-primary/5 text-primary font-semibold text-sm">
                                  {getInitials(user.displayName || user.fullName, user.username)}
                                </AvatarFallback>
                              </Avatar>
                              <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${user.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-sm truncate">{user.displayName || user.fullName || user.username}</span>
                                {user.roles?.some(r => r.toLowerCase() === 'admin') && <Shield className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />}
                              </div>
                              <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                <span>@{user.username}</span>
                                <span className="opacity-40">•</span>
                                <span className="font-mono text-[10px] opacity-50">ID:{user.id}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.email ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button onClick={() => copyToClipboard(user.email!)} className="flex items-center gap-1.5 text-sm hover:text-primary transition-colors max-w-[200px] group/email">
                                  <span className="truncate">{user.email}</span>
                                  <Copy className="h-3 w-3 opacity-0 group-hover/email:opacity-50 flex-shrink-0 transition-opacity" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Click to copy</TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-xs text-muted-foreground/50 italic">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.phoneNumber ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button onClick={() => copyToClipboard(user.phoneNumber!)} className="flex items-center gap-1.5 text-sm font-mono hover:text-primary transition-colors group/phone">
                                  <span>{user.phoneNumber}</span>
                                  {user.phoneVerified && <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />}
                                  <Copy className="h-3 w-3 opacity-0 group-hover/phone:opacity-50 flex-shrink-0 transition-opacity" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>{user.phoneVerified ? 'Verified • Click to copy' : 'Click to copy'}</TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-xs text-muted-foreground/50 italic">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roles && user.roles.length > 0 ? (
                              user.roles.map((role) => (
                                <Badge key={role} variant="outline" className={`text-[11px] px-1.5 py-0 font-medium ${getRoleBadgeStyle(role)}`}>{role}</Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground/60">Member</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={`font-medium text-[11px] ${user.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.memberSince ? (
                            <Tooltip>
                              <TooltipTrigger className="text-sm text-muted-foreground">{formatDate(user.memberSince)}</TooltipTrigger>
                              <TooltipContent>{formatDateTime(user.memberSince)}</TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-xs text-muted-foreground/50 italic">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.lastLoggedIn ? (
                            <Tooltip>
                              <TooltipTrigger className="text-sm text-muted-foreground">{getRelativeTime(user.lastLoggedIn)}</TooltipTrigger>
                              <TooltipContent>{formatDateTime(user.lastLoggedIn)}</TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-xs text-muted-foreground/50 italic">Never</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-60 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onSelect={() => handleViewDetail(user.id)}><Eye className="h-4 w-4" /> View Details</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleEditUser(user.id)}><Edit className="h-4 w-4" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleOpenPasswordDialog(user)}><Key className="h-4 w-4" /> Change Password</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => handleToggleActive(user.id, user.isActive)}>
                                {user.isActive ? <UserX className="h-4 w-4 text-orange-500" /> : <UserCheck className="h-4 w-4 text-green-500" />}
                                {user.isActive ? 'Deactivate' : 'Activate'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()}>
                                    <Trash2 className="h-4 w-4" /> Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                                    <AlertDialogDescription>Are you sure you want to delete "{user.username}"? This cannot be undone.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
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

            {/* Pagination */}
            {totalCount > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="text-sm text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{((currentPage - 1) * pageSize) + 1}</span>–<span className="font-medium text-foreground">{Math.min(currentPage * pageSize, totalCount)}</span> of <span className="font-medium text-foreground">{totalCount}</span> users
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentPage(1)} disabled={currentPage === 1 || loading}>First</Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || loading}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                    return (
                      <Button key={pageNum} variant={currentPage === pageNum ? 'default' : 'outline'} size="icon" className="h-8 w-8" onClick={() => setCurrentPage(pageNum)} disabled={loading}>
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || loading}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || loading}>Last</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Eye className="h-5 w-5" /> User Details</DialogTitle>
            </DialogHeader>
            {detailUser && (
              <div className="space-y-5">
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                  <Avatar className="h-16 w-16 ring-2 ring-border shadow-md">
                    <AvatarImage src={getProfilePictureUrl(detailUser.profilePicture)} alt={detailUser.displayName || detailUser.username} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold text-xl">
                      {getInitials(detailUser.displayName || detailUser.fullName, detailUser.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-lg truncate">{detailUser.displayName || detailUser.fullName || detailUser.username}</h3>
                    <p className="text-sm text-muted-foreground">@{detailUser.username}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge variant="outline" className={detailUser.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'}>
                        {detailUser.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {detailUser.roles?.map(r => (
                        <Badge key={r} variant="outline" className={getRoleBadgeStyle(r)}>{r}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <InfoRow icon={Hash} label="User ID" value={`#${detailUser.id}`} />
                  <InfoRow icon={Mail} label="Email" value={detailUser.email} copyable />
                  <InfoRow
                    icon={Phone}
                    label="Phone"
                    value={detailUser.phoneNumber}
                    extra={detailUser.phoneVerified ? (
                      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 text-[10px] px-1.5 py-0">
                        <CheckCircle className="h-3 w-3 mr-0.5" /> Verified
                      </Badge>
                    ) : null}
                    copyable
                  />
                  <InfoRow icon={Calendar} label="Member Since" value={formatDateTime(detailUser.memberSince)} />
                  <InfoRow icon={Clock} label="Last Login" value={detailUser.lastLoggedIn ? `${formatDateTime(detailUser.lastLoggedIn)} (${getRelativeTime(detailUser.lastLoggedIn)})` : 'Never'} />
                  {detailUser.serialNumber && <InfoRow icon={Hash} label="Serial Number" value={detailUser.serialNumber} />}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => { setIsDetailOpen(false); handleEditUser(detailUser.id); }}>
                    <Edit className="h-4 w-4 mr-1.5" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => { setIsDetailOpen(false); handleOpenPasswordDialog(detailUser); }}>
                    <Key className="h-4 w-4 mr-1.5" /> Password
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Create/Edit User Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editingUser ? <Edit className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                {editingUser ? 'Edit User' : 'Create New User'}
              </DialogTitle>
              <DialogDescription>
                {editingUser ? 'Update user information and contact details' : 'Add a new user to the system'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input id="username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required disabled={!!editingUser} placeholder="e.g. john_doe" />
                </div>
                {!editingUser && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={6} placeholder="Min 6 characters" />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input id="displayName" value={formData.displayName} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })} placeholder="Full name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="user@example.com" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="phoneNumber" className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> Phone Number
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-green-50 text-green-600 border-green-200 ml-1">WhatsApp</Badge>
                  </Label>
                  <Input id="phoneNumber" type="tel" value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} placeholder="e.g. 96892506030" />
                  <p className="text-xs text-muted-foreground">Oman format: 968XXXXXXXX — Required for WhatsApp notifications</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Roles</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 border rounded-lg p-4 bg-muted/20">
                  {roles.map((role) => (
                    <Label key={role.id} htmlFor={`role-${role.id}`} className="flex items-center gap-2.5 cursor-pointer hover:text-primary transition-colors">
                      <input type="checkbox" id={`role-${role.id}`} checked={formData.roles?.includes(role.name)} onChange={() => toggleRole(role.name)} className="rounded border-gray-300 text-primary focus:ring-primary" aria-label={`Role: ${role.name}`} />
                      <span className="text-sm font-normal">{role.name}</span>
                    </Label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Switch id="isActive" checked={formData.isActive} onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })} />
                <Label htmlFor="isActive" className="cursor-pointer">
                  <span className="font-medium">Active</span>
                  <span className="text-xs text-muted-foreground block">User can login and access the system</span>
                </Label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : editingUser ? 'Update User' : 'Create User'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Change Password Dialog */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Key className="h-5 w-5" /> Change Password</DialogTitle>
              <DialogDescription>Change password for: <strong>{selectedUser?.displayName || selectedUser?.username}</strong></DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password *</Label>
                <Input id="newPassword" type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} required minLength={6} placeholder="Min 6 characters" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} placeholder="Re-enter password" />
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <input type="checkbox" id="forceSignOut" checked={passwordData.forceSignOut} onChange={(e) => setPasswordData({ ...passwordData, forceSignOut: e.target.checked })} className="rounded border-gray-300 text-primary focus:ring-primary" aria-label="Force sign out from all devices" />
                <Label htmlFor="forceSignOut" className="cursor-pointer">
                  <span className="text-sm font-medium">Sign out from all devices</span>
                  <span className="text-xs text-muted-foreground block">Invalidate all existing sessions</span>
                </Label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</> : 'Update Password'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

// ─── Info Row Component ────────────────────────────────────────────────────

interface InfoRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | null;
  copyable?: boolean;
  extra?: React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon: Icon, label, value, copyable, extra }) => (
  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium truncate">{value || '—'}</p>
        {extra}
      </div>
    </div>
    {copyable && value && (
      <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => copyToClipboard(value)}>
        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    )}
  </div>
);
