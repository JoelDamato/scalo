import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from './useProfiles';

export interface AdminProfile extends Profile {
  role: 'admin' | 'dev';
}

export function useAdminProfiles() {
  return useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      // First get all internal team user_ids from user_roles
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'dev']);
      
      if (rolesError) throw rolesError;
      
      if (!adminRoles || adminRoles.length === 0) {
        return [];
      }
      
      const adminUserIds = adminRoles.map(r => r.user_id);
      
      // Then get profiles for those internal users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', adminUserIds);
      
      if (profilesError) throw profilesError;
      
      return profiles as Profile[];
    }
  });
}
