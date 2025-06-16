interface BaseHeaderProps {
	children: React.ReactNode;
}

export default function BaseHeader({ children }: BaseHeaderProps) {
	return (
		<div className="border-b p-4">
			<div className="flex items-center justify-between">{children}</div>
		</div>
	);
}
