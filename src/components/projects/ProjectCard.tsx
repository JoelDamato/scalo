import { Project } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { FolderKanban, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const taskCounts = {
    total: project.tasks.length,
    done: project.tasks.filter(t => t.status === 'done').length,
  };

  return (
    <Link to={`/projects/${project.id}`}>
      <Card className="group hover:border-foreground/20 transition-colors cursor-pointer animate-fade-in">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted group-hover:bg-accent transition-colors">
                <FolderKanban className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base font-medium group-hover:text-foreground/80 transition-colors">
                  {project.name}
                </CardTitle>
                {project.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {project.description}
                  </p>
                )}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <StatusBadge status={project.status} />
              <span className="text-xs text-muted-foreground">
                {taskCounts.done}/{taskCounts.total} tasks
              </span>
            </div>
            <div className="flex items-center gap-2">
              {project.client && (
                <>
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                      {project.client.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">
                    Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                  </span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
