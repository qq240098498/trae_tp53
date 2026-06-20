import { PackageOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyProps {
  description?: string;
  className?: string;
}

export default function Empty({ description = '暂无数据', className }: EmptyProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-8', className)}>
      <PackageOpen className="h-12 w-12 text-gray-300 mb-3" />
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}
