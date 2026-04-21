import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from './useProfiles';
import type { AdminProfile } from './useAdminProfiles';

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  created_at: string;
}

export interface ProjectMemberWithProfile extends ProjectMember {
  profile: Profile | null;
}

export interface InternalProjectMemberWithProfile extends ProjectMember {
  profile: AdminProfile | null;
}

export function useProjectMembers(projectId?: string) {
  return useQuery({
    queryKey: ['project-members', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('project_members')
        .select('*')
        .eq('project_id', projectId);
      
      if (error) throw error;
      return data as ProjectMember[];
    },
    enabled: !!projectId
  });
}

export function useProjectMembersWithProfiles(projectId?: string) {
  return useQuery({
    queryKey: ['project-members-profiles', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      // Get project members
      const { data: members, error: membersError } = await supabase
        .from('project_members')
        .select('*')
        .eq('project_id', projectId);
      
      if (membersError) throw membersError;
      if (!members || members.length === 0) return [];
      
      // Get profiles for those members
      const userIds = members.map(m => m.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);
      
      if (profilesError) throw profilesError;
      
      // Combine data
      return members.map(member => ({
        ...member,
        profile: profiles?.find(p => p.user_id === member.user_id) || null
      })) as ProjectMemberWithProfile[];
    },
    enabled: !!projectId
  });
}

export function useInternalProjectMembersWithProfiles(projectId?: string) {
  return useQuery({
    queryKey: ['project-internal-members-profiles', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data: members, error: membersError } = await supabase
        .from('project_members')
        .select('*')
        .eq('project_id', projectId)
        .in('role', ['admin', 'dev']);

      if (membersError) throw membersError;
      if (!members || members.length === 0) return [];

      const userIds = members.map((member) => member.user_id);
      const [{ data: profiles, error: profilesError }, { data: roles, error: rolesError }] = await Promise.all([
        supabase.from('profiles').select('*').in('user_id', userIds),
        supabase.from('user_roles').select('user_id, role').in('user_id', userIds).in('role', ['admin', 'dev']),
      ]);

      if (profilesError) throw profilesError;
      if (rolesError) throw rolesError;

      return members.map((member) => ({
        ...member,
        profile: profiles
          ?.map((profile) => ({
            ...profile,
            role: roles?.find((role) => role.user_id === profile.user_id)?.role || 'dev',
          }))
          .find((profile) => profile.user_id === member.user_id) || null,
      })) as InternalProjectMemberWithProfile[];
    },
    enabled: !!projectId,
  });
}

// Get projects for a specific user (for clients to see their projects)
export function useUserProjects(userId?: string) {
  return useQuery({
    queryKey: ['user-projects', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', userId);
      
      if (error) throw error;
      return data.map(m => m.project_id);
    },
    enabled: !!userId
  });
}

export function useAddProjectMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ projectId, userId, role = 'client' }: { 
      projectId: string; 
      userId: string; 
      role?: string 
    }) => {
      const { data, error } = await supabase
        .from('project_members')
        .insert({ 
          project_id: projectId, 
          user_id: userId,
          role 
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-members', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-members-profiles', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['user-projects', variables.userId] });
    }
  });
}

export function useRemoveProjectMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ projectId, userId }: { projectId: string; userId: string }) => {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-members', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-members-profiles', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['user-projects', variables.userId] });
    }
  });
}

export function useSetProjectMembers() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ projectId, userIds }: { projectId: string; userIds: string[] }) => {
      // First, get current members
      const { data: currentMembers, error: fetchError } = await supabase
        .from('project_members')
        .select('user_id')
        .eq('project_id', projectId);
      
      if (fetchError) throw fetchError;
      
      const currentUserIds = currentMembers?.map(m => m.user_id) || [];
      
      // Determine which to add and which to remove
      const toAdd = userIds.filter(id => !currentUserIds.includes(id));
      const toRemove = currentUserIds.filter(id => !userIds.includes(id));
      
      // Remove old members
      if (toRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('project_members')
          .delete()
          .eq('project_id', projectId)
          .in('user_id', toRemove);
        
        if (removeError) throw removeError;
      }
      
      // Add new members
      if (toAdd.length > 0) {
        const { error: addError } = await supabase
          .from('project_members')
          .insert(toAdd.map(userId => ({
            project_id: projectId,
            user_id: userId,
            role: 'client'
          })));
        
        if (addError) throw addError;
      }
      
      return { added: toAdd, removed: toRemove };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-members', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-members-profiles', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['user-projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });
}

export function useSetInternalProjectMembers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, members }: { projectId: string; members: Array<{ userId: string; role: 'admin' | 'dev' }> }) => {
      const { data: currentMembers, error: fetchError } = await supabase
        .from('project_members')
        .select('user_id, role')
        .eq('project_id', projectId)
        .in('role', ['admin', 'dev']);

      if (fetchError) throw fetchError;

      const currentUserIds = currentMembers?.map((member) => member.user_id) || [];
      const nextUserIds = members.map((member) => member.userId);
      const toRemove = currentUserIds.filter((userId) => !nextUserIds.includes(userId));

      if (toRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('project_members')
          .delete()
          .eq('project_id', projectId)
          .in('user_id', toRemove)
          .in('role', ['admin', 'dev']);

        if (removeError) throw removeError;
      }

      for (const member of members) {
        const { error: upsertError } = await supabase
          .from('project_members')
          .upsert(
            {
              project_id: projectId,
              user_id: member.userId,
              role: member.role,
            },
            { onConflict: 'project_id,user_id' },
          );

        if (upsertError) throw upsertError;
      }

      return { removed: toRemove, assigned: nextUserIds };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-internal-members-profiles', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-members', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-members-profiles', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    },
  });
}
