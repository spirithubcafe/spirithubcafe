import React, { useState, useEffect } from 'react';
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
import { Users, Plus, Edit, Trash2, Search, Loader2, Key, UserCheck, UserX, MoreHorizontal, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { userService } from '../../services/userService';
import type { User, UserCreateDto, UserUpdateDto, Role, PasswordUpdateDto } from '../../services/userService';

export const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [formData, setFormData] = useState<UserCreateDto>({
    username: '',
    password: '',
    displayName: '',
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
      showMessage('Error loading roles list', 'error');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const usersData = await userService.getAll({
        page: currentPage,
        pageSize,
        searchTerm: searchTerm || undefined,
        isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined
      });

      setUsers(usersData.items);
      setTotalCount(usersData.totalCount);
      // Calculate total pages manually to ensure correctness
      const calculatedTotalPages = Math.ceil(usersData.totalCount / pageSize);
      setTotalPages(calculatedTotalPages || 1);
    } catch (error) {
      console.error('Error loading users:', error);
      showMessage('Error loading users list', 'error');
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
        displayName: user.displayName || '',
        isActive: user.isActive,
        roles: user.roles || []
      });
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error loading user:', error);
      showMessage('Error loading user data', 'error');
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
      showMessage('User status updated successfully', 'success');
      await loadData();
    } catch (error) {
      console.error('Error toggling user status:', error);
      showMessage('Error updating user status', 'error');
    }
  };

  const handleOpenPasswordDialog = (user: User) => {
    setSelectedUser(user);
    setPasswordData({
      newPassword: '',
      forceSignOut: true
    });
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
      showMessage('Password must be at least 6 characters long!', 'error');
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

  const exportToExcel = () => {
    try {
      // Create CSV content
      const headers = [
        'Username',
        'Display Name',
        'Email',
        'Phone',
        'Status',
        'Roles',
        'Last Login',
        'User ID'
      ];

      const rows = users.map(user => [
        user.username,
        user.displayName || '',
        (user as any).email || '',
        (user as any).phone || '',
        user.isActive ? 'Active' : 'Inactive',
        user.roles?.join(', ') || 'No roles',
        user.lastLoggedIn ? new Date(user.lastLoggedIn).toLocaleString() : 'Never',
        user.id.toString()
      ]);

      // Convert to CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => 
          row.map(cell => {
            // Escape cells containing commas, quotes, or newlines
            const cellStr = String(cell);
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
              return '"' + cellStr.replace(/"/g, '""') + '"';
            }
            return cellStr;
          }).join(',')
        )
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showMessage(`Exported ${users.length} users successfully`, 'success');
    } catch (error) {
      console.error('Export error:', error);
      showMessage('Export failed. Please try again.', 'error');
    }
  };

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'editor':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading && users.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-6 w-6" />
              <span>Users Management</span>
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={exportToExcel} disabled={loading || users.length === 0} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export to Excel
              </Button>
              <Button onClick={handleCreateUser} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Message */}
          {message && (
            <div className={`p-4 rounded-lg ${
              message.type === 'error' ? 'bg-red-100 text-red-800 border border-red-300' :
              message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' :
              'bg-blue-100 text-blue-800 border border-blue-300'
            }`}>
              {message.text}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full sm:max-w-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mobile list */}
          <div className="md:hidden space-y-3">
            {!users || users.length === 0 ? (
              <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
                No users found
              </div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{user.username}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {user.displayName || '-'}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <Badge
                              key={role}
                              variant="outline"
                              className={getRoleBadgeColor(role)}
                            >
                              {role}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">No roles</span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <Badge variant={user.isActive ? 'default' : 'secondary'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {user.lastLoggedIn
                          ? new Date(user.lastLoggedIn).toLocaleDateString()
                          : 'Never'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" aria-label="Actions" title="Actions">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleEditUser(user.id)}>
                          <Edit className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleOpenPasswordDialog(user)}>
                          <Key className="h-4 w-4" />
                          Password
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => handleToggleActive(user.id, user.isActive)}>
                          {user.isActive ? (
                            <UserX className="h-4 w-4 text-orange-500" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-green-500" />
                          )}
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete user "{user.username}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block w-full min-w-0 max-w-full rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!users || users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.id}</TableCell>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.displayName || '-'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles && user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <Badge 
                                key={role} 
                                variant="outline"
                                className={getRoleBadgeColor(role)}
                              >
                                {role}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">No roles</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.lastLoggedIn ? (
                          new Date(user.lastLoggedIn).toLocaleDateString()
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Actions" title="Actions">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleEditUser(user.id)}>
                              <Edit className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleOpenPasswordDialog(user)}>
                              <Key className="h-4 w-4" />
                              Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => handleToggleActive(user.id, user.isActive)}>
                              {user.isActive ? (
                                <UserX className="h-4 w-4 text-orange-500" />
                              ) : (
                                <UserCheck className="h-4 w-4 text-green-500" />
                              )}
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive focus:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete user "{user.username}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="bg-red-600 hover:bg-red-700"
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

          {/* Pagination */}
          {totalCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground whitespace-nowrap">
                    Records per page:
                  </Label>
                  <Select value={String(pageSize)} onValueChange={(value) => {
                    setPageSize(Number(value));
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="200">200</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalCount)} of {totalCount}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        className="w-9 h-9 p-0"
                        onClick={() => setCurrentPage(pageNum)}
                        disabled={loading}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit User' : 'Create New User'}
            </DialogTitle>
            <DialogDescription>
              {editingUser ? 'Update user information' : 'Add a new user to the system'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  disabled={!!editingUser}
                />
              </div>
              {!editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Roles</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 border rounded-md p-4">
                {roles.map((role) => (
                  <Label
                    key={role.id}
                    htmlFor={`role-${role.id}`}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      id={`role-${role.id}`}
                      checked={formData.roles?.includes(role.name)}
                      onChange={() => toggleRole(role.name)}
                      className="rounded border-gray-300"
                      aria-label={`Role: ${role.name}`}
                    />
                    <span className="text-sm font-normal">
                      {role.name}
                    </span>
                  </Label>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingUser ? 'Update User' : 'Create User'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Change password for user: <strong>{selectedUser?.username}</strong>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password *</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Label htmlFor="forceSignOut" className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                id="forceSignOut"
                checked={passwordData.forceSignOut}
                onChange={(e) => setPasswordData({ ...passwordData, forceSignOut: e.target.checked })}
                className="rounded border-gray-300"
                aria-label="Force sign out from all devices"
              />
              <span className="text-sm font-normal">
                Sign out from all devices
              </span>
            </Label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
