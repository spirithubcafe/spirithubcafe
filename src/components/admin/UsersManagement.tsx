import React, { useState, useEffect } from 'react';
import { useApp } from '../../hooks/useApp';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Users, Plus, Edit, Trash2, Eye, EyeOff, Search, Loader2, Clock, Key } from 'lucide-react';
import { userService } from '../../services/userService';
import type { User, UserCreateDto, UserUpdateDto, Role } from '../../services/userService';

export const UsersManagement: React.FC = () => {
  const { t } = useApp();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const pageSize = 20;

  const [formData, setFormData] = useState<UserCreateDto>({
    username: '',
    password: '',
    displayName: '',
    isActive: true,
    roleIds: []
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const loadDataAsync = async () => {
      try {
        setLoading(true);
        
        // Load roles
        const rolesData = await userService.getRoles();
        setRoles(rolesData);

        // Load users with filters
        const usersData = await userService.getAll({
          page: currentPage,
          pageSize,
          searchTerm: searchTerm || undefined,
          role: roleFilter !== 'all' ? roleFilter : undefined,
          isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined
        });

        setUsers(usersData.items);
        setTotalPages(usersData.totalPages);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDataAsync();
  }, [currentPage, searchTerm, roleFilter, statusFilter, pageSize]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load roles
      const rolesData = await userService.getRoles();
      setRoles(rolesData);

      // Load users with filters
      const usersData = await userService.getAll({
        page: currentPage,
        pageSize,
        searchTerm: searchTerm || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined
      });

      setUsers(usersData.items);
      setTotalPages(usersData.totalPages);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      displayName: '',
      isActive: true,
      roleIds: []
    });
    setIsDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '', // Don't show existing password
      displayName: user.displayName || '',
      isActive: user.isActive,
      roleIds: user.userRoles?.map(ur => ur.roleId) || []
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (editingUser) {
        // Update user (exclude password from update)
        const updateData: UserUpdateDto = {
          displayName: formData.displayName,
          isActive: formData.isActive,
          roleIds: formData.roleIds
        };
        await userService.update(editingUser.id, updateData);
      } else {
        // Create new user
        await userService.create(formData);
      }
      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await userService.delete(userId);
      loadData();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleToggleActive = async (userId: number) => {
    try {
      await userService.toggleActive(userId);
      loadData();
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setPasswordData({
      newPassword: '',
      confirmPassword: ''
    });
    setIsPasswordDialogOpen(true);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || passwordData.newPassword !== passwordData.confirmPassword) {
      return;
    }

    setSubmitting(true);
    try {
      await userService.resetPassword(selectedUser.id, passwordData.newPassword);
      setIsPasswordDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error resetting password:', error);
    } finally {
      setSubmitting(false);
    }
  };



  const getRoleBadgeVariant = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'admin':
        return 'destructive';
      case 'manager':
        return 'default';
      case 'editor':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">{t('common.loading')}</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-6 w-6" />
          <span>{t('admin.users.title')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('admin.users.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t('admin.users.selectRole')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.users.allRoles')}</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.name.toLowerCase()}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t('admin.users.selectStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.users.allStatuses')}</SelectItem>
                <SelectItem value="active">{t('admin.users.active')}</SelectItem>
                <SelectItem value="inactive">{t('admin.users.inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreateUser}>
            <Plus className="h-4 w-4 mr-2" />
            {t('admin.users.add')}
          </Button>
        </div>

        {/* Users Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.users.username')}</TableHead>
                <TableHead>{t('admin.users.displayName')}</TableHead>
                <TableHead>{t('admin.users.roles')}</TableHead>
                <TableHead className="text-center">{t('admin.users.status')}</TableHead>
                <TableHead className="text-center">{t('admin.users.lastLogin')}</TableHead>
                <TableHead className="text-center">{t('admin.users.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {t('admin.users.noUsers')}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.displayName || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {user.userRoles?.map((userRole) => (
                          <Badge
                            key={userRole.roleId}
                            variant={getRoleBadgeVariant(userRole.role.name)}
                            className="text-xs"
                          >
                            {userRole.role.name}
                          </Badge>
                        )) || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? t('admin.users.active') : t('admin.users.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {user.lastLoggedIn ? 
                            new Date(user.lastLoggedIn).toLocaleDateString() : 
                            t('admin.users.never')
                          }
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(user.id)}
                        >
                          {user.isActive ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResetPassword(user)}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('admin.users.deleteConfirm')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('admin.users.deleteWarning')} "{user.username}"
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {t('common.delete')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              {t('common.previous')}
            </Button>
            <span className="flex items-center px-4">
              {t('common.page')} {currentPage} {t('common.of')} {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              {t('common.next')}
            </Button>
          </div>
        )}

        {/* Create/Edit User Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? t('admin.users.edit') : t('admin.users.add')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">{t('admin.users.username')} *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder={t('admin.users.usernamePlaceholder')}
                    required
                    disabled={!!editingUser} // Can't change username when editing
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">{t('admin.users.displayName')}</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder={t('admin.users.displayNamePlaceholder')}
                  />
                </div>
              </div>

              {!editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="password">{t('admin.users.password')} *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder={t('admin.users.passwordPlaceholder')}
                    required={!editingUser}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>{t('admin.users.roles')} *</Label>
                <div className="flex flex-wrap gap-2">
                  {roles.map((role) => (
                    <label key={role.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.roleIds.includes(role.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              roleIds: [...prev.roleIds, role.id]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              roleIds: prev.roleIds.filter(id => id !== role.id)
                            }));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <Badge variant={getRoleBadgeVariant(role.name)}>
                        {role.name}
                      </Badge>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">{t('admin.users.active')}</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingUser ? t('common.update') : t('common.create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {t('admin.users.resetPassword')} - {selectedUser?.username}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('admin.users.newPassword')} *</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('admin.users.confirmPassword')} *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                />
                {passwordData.newPassword && passwordData.confirmPassword && 
                 passwordData.newPassword !== passwordData.confirmPassword && (
                  <p className="text-sm text-red-600">{t('admin.users.passwordMismatch')}</p>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting || passwordData.newPassword !== passwordData.confirmPassword}
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('admin.users.resetPassword')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};