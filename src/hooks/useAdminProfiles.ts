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
      const { data: internalRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['admin', 'dev']);
      
      if (rolesError) throw rolesError;
      
      if (!internalRoles || internalRoles.length === 0) {
        return [];
      }
      
      const internalUserIds = internalRoles.map((item) => item.user_id);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', internalUserIds);
      
      if (profilesError) throw profilesError;
      
      return (profiles || []).map((profile) => ({
        ...profile,
        role: internalRoles.find((item) => item.user_id === profile.user_id)?.role || 'dev',
      })) as AdminProfile[];
    }
  });
}
