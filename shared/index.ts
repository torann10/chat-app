export interface User {
    id: number;
    username: string;
    email: string;
    avatar_url: string;
    is_online: string;
}

export interface Message {
    id: number;
    room_id: number;
    sender_id: number;
    content: string;
    created_at: string;
}

export type RoomType = 'public' | 'private' | 'pw_protected' | 'dm';

export interface Room {
    id: number,
    name: string;
    type: string;
}