// ─────────────────────────────────────────────
// XCSM V3 — Types Système de Commentaires
// types/comments.types.ts
// ─────────────────────────────────────────────

export type CommentType = "comment" | "suggestion" | "question" | "correction";
export type CommentStatus = "pending" | "approved" | "rejected" | "implemented";
export type UserRole = "etudiant" | "enseignant" | "admin";

export interface CommentAuthor {
    id: string;
    display_name: string; // "Prénom N." — semi-anonymisé
    role: UserRole;
    initials: string;     // "PN"
}

export interface CommentReply {
    id: string;
    content: string;
    author: CommentAuthor;
    created_at: string;
    upvotes: number;
    user_has_upvoted: boolean;
}

export interface Comment {
    id: string;
    granule_id: string;
    granule_title?: string;
    course_id: string;
    type: CommentType;
    content: string;
    author: CommentAuthor;
    status: CommentStatus;
    upvotes: number;
    downvotes: number;
    user_vote: "up" | "down" | null;
    replies: CommentReply[];
    replies_count: number;
    created_at: string;
    updated_at: string;
    is_pinned: boolean;
    is_resolved: boolean;
}

export interface Notification {
    id: string;
    type:
    | "new_comment"
    | "reply"
    | "upvote"
    | "suggestion_approved"
    | "suggestion_rejected"
    | "mention";
    title: string;
    message: string;
    link?: string;
    is_read: boolean;
    created_at: string;
    actor_name?: string;
}