import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export const Error: React.FC<{ text: string; subText: string; Icon: LucideIcon; color: string }> = ({ text, subText, Icon, color }) => {
	return (
		<div className="w-full h-full flex flex-1 flex-col items-center justify-center text-center p-4">
			<Icon className={cn('w-16 h-16 mb-4', color)} />
			<h2 className="text-xl font-semibold text-gray-700 mb-2">{text}</h2>
			<p className="text-gray-500">{subText}</p>
		</div>
	);
};
