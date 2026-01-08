"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetAdmins, useUpdateUserRole, useUpdateUserStatus } from "@/hooks/useUsers";
import { permissionsApi } from '@/lib/api/permissions';
import { Role } from '@/types/permissions';
import { User } from '@/types/users';
import { ChevronLeft, ChevronRight, MoreHorizontal, Plus, Search, ShieldCheck, UserCog, UserX } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from 'react-toastify';
import { AddAdminDialog } from "./components/AddAdminDialog";

export default function AdminManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [roleDialog, setRoleDialog] = useState<{ isOpen: boolean; user: User | null; }>({ isOpen: false, user: null });
  const [deactivateDialog, setDeactivateDialog] = useState<{ isOpen: boolean; user: User | null; }>({ isOpen: false, user: null });
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const limit = 10;

  // TanStack Query hooks
  const { data: adminsData, isLoading } = useGetAdmins({ page, limit, search: searchQuery || undefined });

  const updateRoleMutation = useUpdateUserRole();
  const updateUserStatusMutation = useUpdateUserStatus();

  const admins = useMemo(() => adminsData?.data || [], [adminsData?.data]);
  const pagination = adminsData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };

  // Filter admins based on local search
  const filteredAdmins = useMemo(() => {
    if (!searchQuery) return admins;
    const query = searchQuery.toLowerCase();
    return admins.filter(admin => {
      const fullName = `${admin.firstName || ''} ${admin.lastName || ''}`.trim();
      return fullName.toLowerCase().includes(query) || admin.email.toLowerCase().includes(query);
    });
  }, [admins, searchQuery]);

  const handleUpdateRole = () => {
    if (!roleDialog.user || !selectedRole) return;

    updateRoleMutation.mutate({
      userId: roleDialog.user.userId,
      role: selectedRole
    }, {
      onSuccess: () => {
        setRoleDialog({ isOpen: false, user: null });
        setSelectedRole("");
      }
    });
  };

  const handleDeactivateUser = () => {
    if (!deactivateDialog.user) return;

    updateUserStatusMutation.mutate({
      userId: deactivateDialog.user.userId,
      updateData: {
        status: 'INACTIVE'
      }
    }, {
      onSuccess: () => {
        setDeactivateDialog({ isOpen: false, user: null });
      }
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      OTHERS: "bg-purple-50 text-purple-600 border-purple-200",
      SUPER_ADMIN: "bg-purple-100 text-purple-700 border-purple-300",
    };

    const className = colors[role as keyof typeof colors] || colors.OTHERS;

    return (
      <Badge variant="outline" className={"whitespace-nowrap "+className}>
        {role.replace('_', ' ')}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      ACTIVE: { variant: "default" as const, className: "bg-green-50 text-green-600 border-green-200" },
      INACTIVE: { variant: "secondary" as const, className: "bg-yellow-50 text-yellow-600 border-yellow-200" },
      SUSPENDED: { variant: "destructive" as const, className: "bg-red-50 text-red-600 border-red-200" },
    };

    const config = variants[status as keyof typeof variants] || variants.ACTIVE;

    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0) + status.slice(1).toLowerCase()}
      </Badge>
    );
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoadingRoles(true);
    try {
      const rolesData = await permissionsApi.getAllRoles();

      setRoles(rolesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load roles and permissions');
    } finally {
      setIsLoadingRoles(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading admins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/dashboard/admin/users">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Admin Users</h1>
          </div>
          <p className="text-muted-foreground">
            Manage admin and super admin users
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Admin
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
            <p className="text-xs text-muted-foreground">
              All admin users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {admins.filter(a => a.userRole?.name === 'SUPER_ADMIN').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Full access users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Admins</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {admins.filter(a => a.userRole?.name === 'ADMIN').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Limited access users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Admin Users</CardTitle>
              <CardDescription>View and manage all admin users</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search admins..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-[300px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdmins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No admin users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAdmins.map((admin) => {
                  const fullName = `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || admin.email;
                  return (
                    <TableRow key={admin.userId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={admin.avatarUrl} alt={fullName} />
                            <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{fullName}</div>
                            <div className="text-sm text-muted-foreground">{admin.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(admin.userRole?.name)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(admin.status)}
                      </TableCell>
                      <TableCell>
                        {admin.lastLoginAt ? formatDate(admin.lastLoginAt) : 'Never'}
                      </TableCell>
                      <TableCell>
                        {formatDate(admin.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setRoleDialog({ isOpen: true, user: admin });
                                setSelectedRole(admin.userRole?.name || "");
                              }}
                            >
                              <UserCog className="h-4 w-4 mr-2" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setDeactivateDialog({ isOpen: true, user: admin });
                              }}
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Deactivate User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} admins
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => setPage(pagination.page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage(pagination.page + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Admin Dialog */}
      <AddAdminDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />

      {/* Change Role Dialog */}
      <Dialog open={roleDialog.isOpen} onOpenChange={(open) => {
        if (!open) {
          setRoleDialog({ isOpen: false, user: null });
          setSelectedRole("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {roleDialog.user ? `${roleDialog.user.firstName || ''} ${roleDialog.user.lastName || ''}`.trim() || roleDialog.user.email : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Role</label>
              <select
                className="w-full p-2 border rounded-md"
                value={selectedRole}
                disabled={isLoadingRoles}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="">Select a role</option>
                {
                  roles.map((role) => (
                    <option key={role.roleId} value={role.roleId}>{role.name}</option>
                  ))
                }
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRoleDialog({ isOpen: false, user: null });
                setSelectedRole("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={!selectedRole || updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate User Confirmation Dialog */}
      <Dialog open={deactivateDialog.isOpen} onOpenChange={(open) => {
        if (!open) {
          setDeactivateDialog({ isOpen: false, user: null });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate User</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate this user account?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {deactivateDialog.user && (
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={deactivateDialog.user.avatarUrl} />
                    <AvatarFallback>
                      {getInitials(`${deactivateDialog.user.firstName || ''} ${deactivateDialog.user.lastName || ''}`.trim() || deactivateDialog.user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {`${deactivateDialog.user.firstName || ''} ${deactivateDialog.user.lastName || ''}`.trim() || deactivateDialog.user.email}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {deactivateDialog.user.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  {getRoleBadge(deactivateDialog.user.userRole?.name)}
                  {getStatusBadge(deactivateDialog.user.status)}
                </div>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex gap-2">
                <UserX className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">This action will:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Set the user status to INACTIVE</li>
                    <li>Prevent the user from logging in</li>
                    <li>Maintain all user data and history</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeactivateDialog({ isOpen: false, user: null });
              }}
              disabled={updateUserStatusMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivateUser}
              disabled={updateUserStatusMutation.isPending}
            >
              {updateUserStatusMutation.isPending ? "Deactivating..." : "Deactivate User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
