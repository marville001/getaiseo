import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { userApi } from '../lib/api/user.api';

// Define error type for API responses
interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

interface GetUsersFilters {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
}

interface GetPendingTeachersFilters {
  page?: number;
  limit?: number;
}

// Query keys
export const USERS_QUERY_KEYS = {
  all: ['users'] as const,
  lists: () => [...USERS_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: GetUsersFilters) => [...USERS_QUERY_KEYS.lists(), filters] as const,
  pendingTeachers: (filters?: GetPendingTeachersFilters) => [...USERS_QUERY_KEYS.all, 'pending-teachers', filters] as const,
  teacherDetails: (teacherId: string) => [...USERS_QUERY_KEYS.all, 'teacher-details', teacherId] as const,
  admins: (filters?: { page?: number; limit?: number; search?: string }) => [...USERS_QUERY_KEYS.all, 'admins', filters] as const,
  userDetails: (userId: string) => [...USERS_QUERY_KEYS.all, 'user-details', userId] as const,
};

// Get all users
export const useGetUsers = (query?: {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: USERS_QUERY_KEYS.list(query),
    queryFn: () => userApi.getUsers(query),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};


// Update user status mutation
export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, updateData }: { userId: string; updateData: { status: string; reason?: string } }) =>
      userApi.updateUserStatus(userId, updateData),
    onSuccess: () => {
      // Invalidate and refetch users queries
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.all });
      toast.success('User status updated successfully');
    },
    onError: (error: ApiErrorResponse) => {
      const errorMessage = error.response?.data?.message || 'Failed to update user status';
      toast.error(errorMessage);
    },
  });
};
// Get admin users
export const useGetAdmins = (query?: { page?: number; limit?: number; search?: string }) => {
  return useQuery({
    queryKey: USERS_QUERY_KEYS.admins(query),
    queryFn: () => userApi.getAdmins(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Create admin mutation
export const useCreateAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (adminData: { email: string; password: string; firstName: string; lastName: string; roleId: string }) => userApi.createAdmin(adminData),
    onSuccess: () => {
      // Invalidate admin queries
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.all });
      toast.success('Admin user created successfully');
    },
    onError: (error: ApiErrorResponse) => {
      const errorMessage = error.response?.data?.message || 'Failed to create admin user';
      toast.error(errorMessage);
    },
  });
};

// Update user role mutation
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      userApi.updateUserRole(userId, role),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.all });
      toast.success('User role updated successfully');
    },
    onError: (error: ApiErrorResponse) => {
      const errorMessage = error.response?.data?.message || 'Failed to update user role';
      toast.error(errorMessage);
    },
  });
};

// Get user details
export const useGetUserDetails = (userId: string) => {
  return useQuery({
    queryKey: USERS_QUERY_KEYS.userDetails(userId),
    queryFn: () => userApi.getUserDetails(userId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId,
  });
};
