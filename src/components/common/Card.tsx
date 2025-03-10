import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className }: CardProps) {
  return (
    <div className={cn(
      'bg-white dark:bg-dark-800 rounded-lg shadow-sm ring-1 ring-slate-200/50 dark:ring-dark-700/50 p-6',
      className
    )}>
      {children}
    </div>
  );
}