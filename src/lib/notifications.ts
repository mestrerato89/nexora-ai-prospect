import { supabase } from "@/integrations/supabase/client";

export type NotificationType = 'lead' | 'payment' | 'system' | 'follow_up' | 'ai';

export const createNotification = async (
    userId: string,
    title: string,
    description: string,
    type: NotificationType = 'system'
) => {
    try {
        const { error } = await (supabase as any).from('notifications').insert({
            user_id: userId,
            title,
            description,
            type
        });

        if (error) {
            console.error('Error creating notification:', error);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Failed to create notification:', error);
        return false;
    }
};

export const markAsRead = async (notificationId: string) => {
    const { error } = await (supabase as any)
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

    return !error;
};

export const markAllAsRead = async (userId: string) => {
    const { error } = await (supabase as any)
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

    return !error;
};
