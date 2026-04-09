import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (supported && user?.id) {
      checkSubscription();
    }
  }, [user?.id]);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch {
      setIsSubscribed(false);
    }
  };

  const subscribe = useCallback(async () => {
    if (!user?.id || !isSupported) return;
    setIsLoading(true);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Necesitás permitir las notificaciones');
        return;
      }

      const registration = await navigator.serviceWorker.ready;

      // Use a placeholder VAPID key - in production this should come from env
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        // Fallback: just enable notification permission without push subscription
        toast.success('Notificaciones habilitadas (sin push remoto)');
        setIsSubscribed(true);
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      });

      const subJson = subscription.toJSON();

      // Save to database - cast to any to handle type generation delay
      const { error } = await (supabase.from('push_subscriptions' as any) as any).insert({
        user_id: user.id,
        endpoint: subJson.endpoint,
        p256dh: subJson.keys?.p256dh,
        auth: subJson.keys?.auth,
      });

      if (error) throw error;

      setIsSubscribed(true);
      toast.success('🔔 Push notifications activadas');
    } catch (err) {
      console.error('Push subscription error:', err);
      toast.error('Error al activar notificaciones push');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        await (supabase.from('push_subscriptions' as any) as any)
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint);
      }

      setIsSubscribed(false);
      toast.success('Push notifications desactivadas');
    } catch (err) {
      console.error('Push unsubscribe error:', err);
      toast.error('Error al desactivar notificaciones');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  return { isSupported, isSubscribed, isLoading, subscribe, unsubscribe };
}
