import { useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Loader2 } from 'lucide-react';
import { useCurrentProfile, useUploadAvatar } from '@/hooks/useProfiles';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AvatarUpload({ size = 'md', className }: AvatarUploadProps) {
  const { data: profile } = useCurrentProfile();
  const uploadAvatar = useUploadAvatar();
  const [isHovering, setIsHovering] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-16 w-16',
    lg: 'h-24 w-24'
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 5MB');
      return;
    }

    try {
      await uploadAvatar.mutateAsync(file);
      toast.success('Foto de perfil actualizada');
    } catch (error) {
      toast.error('Error al subir la imagen');
    }
  };

  const initials = profile?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <div className={cn('relative inline-block', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <div
        className="relative cursor-pointer"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={() => inputRef.current?.click()}
      >
        <Avatar className={cn(sizeClasses[size], 'transition-opacity', isHovering && 'opacity-70')}>
          <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.name} />
          <AvatarFallback className="bg-primary/20 text-primary font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        {(isHovering || uploadAvatar.isPending) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
            {uploadAvatar.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <Camera className="h-4 w-4 text-white" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
