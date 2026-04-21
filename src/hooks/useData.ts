import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'completed' | 'on-hold';
  support_active: boolean;
  client_id: string | null;
  customer_id: string | null;
  onboarding_token: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'backlog' | 'in-progress' | 'review' | 'done';
  project_id: string | null;
  assignee_id: string | null;
  source_ticket_id: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  scheduled_end_time: string | null;
  is_client_visible: boolean;
  client_input_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  content: string;
  task_id: string;
  author_id: string;
  created_at: string;
  author?: Profile;
}

export interface Activity {
  id: string;
  type: string;
  message: string;
  user_id: string;
  project_id: string | null;
  task_id: string | null;
  created_at: string;
  user?: Profile;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  uploaded_by: string;
  file_path: string;
  file_name: string;
  content_type: string;
  file_size: number;
  created_at: string;
  signed_url?: string | null;
}

export const TASK_ATTACHMENTS_BUCKET = 'task-attachments';
export const MAX_TASK_IMAGE_SIZE = 10 * 1024 * 1024;

function validateTaskImage(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Solo se pueden adjuntar imágenes');
  }

  if (file.size > MAX_TASK_IMAGE_SIZE) {
    throw new Error('Cada imagen debe pesar menos de 10 MB');
  }
}

export async function getTaskAttachmentUrl(path: string) {
  const { data, error } = await supabase.storage
    .from(TASK_ATTACHMENTS_BUCKET)
    .createSignedUrl(path, 60 * 60);

  if (error) {
    console.error('Error creating signed URL for task attachment:', error);
    return null;
  }

  return data.signedUrl;
}

async function uploadTaskImageAttachment(file: File, userId: string, taskId: string) {
  validateTaskImage(file);

  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filePath = `${userId}/${taskId}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

  const { error } = await supabase.storage
    .from(TASK_ATTACHMENTS_BUCKET)
    .upload(filePath, file, {
      upsert: false,
      contentType: file.type,
    });

  if (error) throw error;

  return {
    file_path: filePath,
    file_name: file.name,
    content_type: file.type,
    file_size: file.size,
  };
}

async function createTaskImageAttachments({
  taskId,
  files = [],
  userId,
}: {
  taskId: string;
  files?: File[];
  userId: string;
}) {
  if (files.length === 0) return [];

  const uploadedFiles: Awaited<ReturnType<typeof uploadTaskImageAttachment>>[] = [];

  try {
    for (const file of files) {
      uploadedFiles.push(await uploadTaskImageAttachment(file, userId, taskId));
    }

    const { data, error } = await supabase
      .from('task_attachments')
      .insert(
        uploadedFiles.map((file) => ({
          task_id: taskId,
          uploaded_by: userId,
          file_path: file.file_path,
          file_name: file.file_name,
          content_type: file.content_type,
          file_size: file.file_size,
        })),
      )
      .select('*');

    if (error) throw error;
    return data;
  } catch (error) {
    if (uploadedFiles.length > 0) {
      await supabase.storage
        .from(TASK_ATTACHMENTS_BUCKET)
        .remove(uploadedFiles.map((file) => file.file_path));
    }

    throw error;
  }
}

// Projects hooks
export function useProjects() {
  const { user, isAdmin } = useAuth();
  
  return useQuery({
    queryKey: ['projects', isAdmin, user?.id],
    queryFn: async () => {
      // Admins see all projects
      if (isAdmin) {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('updated_at', { ascending: false });
        
        if (error) throw error;
        return data as Project[];
      }
      
      // Clients see only projects they're members of
      if (!user?.id) return [];
      
      // First get project IDs where user is a member
      const { data: memberships, error: membershipError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);
      
      if (membershipError) throw membershipError;
      if (!memberships || memberships.length === 0) return [];
      
      const projectIds = memberships.map(m => m.project_id);
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .in('id', projectIds)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as Project[];
    },
    enabled: !!user
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Project | null;
    },
    enabled: !!id
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (project: { name: string; description?: string; status?: string; support_active?: boolean; client_id?: string; customer_id?: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .insert(project)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });
}

// Tasks hooks
// projectId: specific project | 'internal' for tasks without project | undefined for all
export function useTasks(projectId?: string | 'internal') {
  const { user, isAdmin } = useAuth();
  
  return useQuery({
    queryKey: ['tasks', projectId, isAdmin, user?.id],
    queryFn: async () => {
      let query = supabase.from('tasks').select('*');
      
      if (projectId === 'internal') {
        // Internal/operational tasks have no project - only for admins
        query = query.is('project_id', null);
      } else if (projectId) {
        query = query.eq('project_id', projectId);
      } else if (!isAdmin && user?.id) {
        // Clients without specific projectId: get tasks only for their projects
        const { data: memberships } = await supabase
          .from('project_members')
          .select('project_id')
          .eq('user_id', user.id);
        
        if (!memberships || memberships.length === 0) {
          return [] as Task[];
        }
        
        const projectIds = memberships.map(m => m.project_id);
        query = query.in('project_id', projectIds);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Task[];
    }
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: Task['status'] }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', taskId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    }
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { user, role } = useAuth();
  
  return useMutation({
    mutationFn: async (task: { title: string; project_id?: string | null; description?: string; status?: string; assignee_id?: string; source_ticket_id?: string | null; scheduled_date?: string | null; scheduled_time?: string | null; scheduled_end_time?: string | null; is_client_visible?: boolean; client_input_required?: boolean; images?: File[] }) => {
      const { images = [], ...taskPayload } = task;
      const taskToCreate = {
        ...taskPayload,
        assignee_id: role !== 'admin' && user?.id && !taskPayload.assignee_id ? user.id : taskPayload.assignee_id,
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert(taskToCreate)
        .select()
        .single();
      
      if (error) throw error;

      if (images.length > 0) {
        if (!user?.id) {
          throw new Error('Debes iniciar sesión');
        }

        await createTaskImageAttachments({
          taskId: data.id,
          files: images,
          userId: user.id,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    }
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<Pick<Task, 'is_client_visible' | 'client_input_required' | 'title' | 'description' | 'source_ticket_id' | 'scheduled_date' | 'scheduled_time' | 'scheduled_end_time'>> }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    }
  });
}

export function useTaskAttachments(taskId: string) {
  return useQuery({
    queryKey: ['task-attachments', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_attachments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const attachments = await Promise.all(
        (data || []).map(async (attachment) => ({
          ...(attachment as TaskAttachment),
          signed_url: await getTaskAttachmentUrl(attachment.file_path),
        })),
      );

      return attachments;
    },
    enabled: !!taskId,
  });
}

export function useAddTaskAttachments() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ taskId, images }: { taskId: string; images: File[] }) => {
      if (!user?.id) throw new Error('Debes iniciar sesión');
      if (images.length === 0) return [];

      return createTaskImageAttachments({
        taskId,
        files: images,
        userId: user.id,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-attachments', variables.taskId] });
    },
  });
}

// Delete Task
export function useDeleteTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });
}

// Update Project
export function useUpdateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ projectId, updates }: { projectId: string; updates: Partial<Pick<Project, 'name' | 'description' | 'status' | 'support_active' | 'customer_id'>> }) => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId] });
    }
  });
}

// Delete Project
export function useDeleteProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase.rpc('delete_project_cascade' as any, {
        p_project_id: projectId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });
}

// Comments hooks
export function useComments(taskId: string) {
  return useQuery({
    queryKey: ['comments', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as Comment[];
    },
    enabled: !!taskId
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ taskId, content }: { taskId: string; content: string }) => {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          task_id: taskId,
          content,
          author_id: user?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.taskId] });
    }
  });
}

// Activities hooks
export function useActivities(projectId?: string) {
  const { user, isAdmin } = useAuth();
  
  return useQuery({
    queryKey: ['activities', projectId, isAdmin, user?.id],
    queryFn: async () => {
      let query = supabase.from('activities').select('*');
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      } else if (!isAdmin && user?.id) {
        // Clients: only get activities from their projects
        const { data: memberships } = await supabase
          .from('project_members')
          .select('project_id')
          .eq('user_id', user.id);
        
        if (!memberships || memberships.length === 0) {
          return [] as Activity[];
        }
        
        const projectIds = memberships.map(m => m.project_id);
        query = query.in('project_id', projectIds);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as Activity[];
    }
  });
}

// Profile hooks
export function useProfile(userId?: string) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!userId
  });
}

// Progress calculation
export function calculateProgress(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter(t => t.status === 'done').length;
  return Math.round((done / tasks.length) * 100);
}
