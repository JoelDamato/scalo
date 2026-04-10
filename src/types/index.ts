export type UserRole = 'admin' | 'dev' | 'client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export type TaskStatus = 'backlog' | 'in-progress' | 'review' | 'done';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  projectId: string;
  assigneeId?: string;
  assignee?: User;
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
  isClientVisible: boolean;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  author: User;
  taskId: string;
  createdAt: string;
}

export type ProjectStatus = 'active' | 'completed' | 'on-hold';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  clientId: string;
  client?: User;
  createdAt: string;
  updatedAt: string;
  tasks: Task[];
}

export interface ActivityItem {
  id: string;
  type: 'task_created' | 'task_updated' | 'task_status_changed' | 'comment_added' | 'project_created';
  message: string;
  userId: string;
  user: User;
  projectId?: string;
  taskId?: string;
  createdAt: string;
}

export interface ServiceTemplate {
  id: string;
  name: string;
  description: string;
  defaultTasks: {
    title: string;
    description?: string;
    status: TaskStatus;
    isClientVisible: boolean;
  }[];
}
