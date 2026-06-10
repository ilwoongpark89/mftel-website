// ─── Dashboard Type Definitions ─────────────────────────────────────────────

export type TeamData = { lead: string; members: string[]; color: string; emoji?: string };

export type Comment = { id: number; author: string; text: string; date: string; imageUrl?: string };

export type Paper = { id: number; title: string; journal: string; status: string; assignees: string[]; tags: string[]; deadline: string; progress: number; comments: Comment[]; creator?: string; createdAt?: string; needsDiscussion?: boolean; team?: string; files?: LabFile[] };

export type Todo = { id: number; text: string; assignees: string[]; done: boolean; priority: string; deadline: string; progress?: number; needsDiscussion?: boolean; comments?: Comment[] };

export type ExperimentLog = { id: number; date: string; author: string; text: string; imageUrl?: string };

export type Experiment = { id: number; title: string; equipment: string; status: string; assignees: string[]; goal: string; startDate: string; endDate: string; logs: ExperimentLog[]; progress?: number; creator?: string; createdAt?: string; needsDiscussion?: boolean; team?: string; files?: LabFile[] };

export type Announcement = { id: number; text: string; author: string; date: string; pinned: boolean; imageUrl?: string };

export type VacationEntry = { name: string; date: string; type: string };

export type ScheduleEvent = { name: string; date: string; type: string; description: string };

export type TimetableBlock = { id: number; day: number; startSlot: number; endSlot: number; name: string; students: string[]; color: string; semester?: string; location?: string; creator?: string };

export type ChecklistItem = { id: number; text: string; done: boolean };

export type Report = { id: number; title: string; assignees: string[]; creator: string; deadline: string; progress: number; comments: Comment[]; status: string; createdAt: string; checklist: ChecklistItem[]; category?: string; needsDiscussion?: boolean; team?: string; files?: LabFile[] };

export type DailyTarget = { name: string; date: string; text: string };

export type Resource = { id: number; title: string; link: string; nasPath: string; author: string; date: string; comments: Comment[]; needsDiscussion?: boolean; files?: LabFile[] };

export type IdeaPost = { id: number; title: string; body: string; author: string; date: string; comments: Comment[]; needsDiscussion?: boolean; color?: string; borderColor?: string; imageUrl?: string };

export type Memo = { id: number; title: string; content: string; color: string; borderColor?: string; updatedAt: string; needsDiscussion?: boolean; comments?: Comment[] };

export type TeamMemoCard = { id: number; title: string; content: string; status: string; color: string; borderColor?: string; author: string; updatedAt: string; comments?: Comment[]; needsDiscussion?: boolean; imageUrl?: string };

export type TeamChatMsg = { id: number; author: string; text: string; date: string; imageUrl?: string; replyTo?: { id: number; author: string; text: string }; reactions?: Record<string, string[]>; deleted?: boolean; edited?: boolean; _sending?: boolean; _failed?: boolean };

export type LabFile = { id: number; name: string; size: number; url: string; type: string; uploader: string; date: string };

export type ConferenceTrip = { id: number; title: string; startDate: string; endDate: string; homepage: string; fee: string; participants: string[]; creator: string; createdAt: string; status?: string; location?: string; comments?: Comment[]; needsDiscussion?: boolean; files?: LabFile[] };

export type Meeting = { id: number; title: string; goal: string; summary: string; date: string; assignees: string[]; status: string; creator: string; createdAt: string; comments: Comment[]; team?: string; needsDiscussion?: boolean; files?: LabFile[] };

export type Patent = { id: number; title: string; deadline: string; status: string; assignees: string[]; progress?: number; creator?: string; createdAt?: string; needsDiscussion?: boolean; team?: string; files?: LabFile[]; comments?: Comment[] };

export type AnalysisLog = { id: number; date: string; author: string; text: string; imageUrl?: string };

export type Analysis = { id: number; title: string; tool: string; status: string; assignees: string[]; goal: string; startDate: string; endDate: string; logs: AnalysisLog[]; progress?: number; creator?: string; createdAt?: string; needsDiscussion?: boolean; team?: string; files?: LabFile[] };

export type ExpLogEntry = { id: number; title: string; date: string; author: string; conditions: string; specimen: string; data: string; notes: string; imageUrl?: string; createdAt: string; category?: string };

export type AnalysisLogEntry = { id: number; title: string; date: string; author: string; tool: string; meshInfo: string; boundaryConditions: string; results: string; notes: string; imageUrl?: string; createdAt: string; category?: string };

export type MenuConfig = {
    key: string;
    name: string;
    emoji: string;
    sortOrder: number;
    isActive: boolean;
    section: string;
    isClone?: boolean;
    cloneSource?: string;
};
