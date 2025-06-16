'use client';

import { ScrollArea } from '@workspace/ui/components/scroll-area';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import {
	UserIcon,
	PinIcon,
	ChevronDownIcon,
	MoreHorizontalIcon,
	TrashIcon,
	EditIcon,
	PinOffIcon,
} from 'lucide-react';
import { Label } from '@workspace/ui/components/label';
import { usePlaygroundStore } from '@/store/playground';
import type { PersonaSelect } from '@/database/client/schema';
import CircleLoading from '@/components/Loading/CircleLoading';
import SkeletonLoading from '@/components/Loading/SkeletonLoading';
import { toast } from 'sonner';
import { useEditPersonaDialog } from '@/store/user/selectors';

function PersonaItem({ persona }: { persona: PersonaSelect }) {
	const { deletePersona } = usePlaygroundStore();
	const { handlePinnedPersona, setEditingPersona } = usePlaygroundStore();
	const { openDialog: openEditDialog } = useEditPersonaDialog();
	const isPinned = persona.pinned;

	const handleSelectPersona = () => {
		handlePinnedPersona(persona.id);
	};

	const handleDelete = async (e: React.MouseEvent) => {
		e.stopPropagation();
		try {
			await deletePersona(persona.id);
			toast.success('Persona deleted successfully');
		} catch (error) {
			toast.error('Failed to delete persona');
			console.error('Failed to delete persona:', error);
		}
	};

	const handleTogglePin = async (e: React.MouseEvent) => {
		e.stopPropagation();
		try {
			await handlePinnedPersona(persona.id);
			toast.success(persona.pinned ? 'Persona unpinned' : 'Persona pinned');
		} catch (error) {
			toast.error('Failed to update persona');
			console.error('Failed to update persona:', error);
		}
	};

	const handleEdit = async (e: React.MouseEvent) => {
		e.stopPropagation();
		setEditingPersona(persona);
		openEditDialog();
	};

	return (
		<div
			className={`p-2 rounded-lg cursor-pointer transition-all duration-200 ${
				isPinned
					? 'bg-primary/10 hover:bg-primary/20 border border-primary/20'
					: 'hover:bg-muted/50'
			}`}
			onClick={handleSelectPersona}
		>
			<div className="flex items-center gap-2">
				<UserIcon size={12} className="text-primary flex-shrink-0" />
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<Label className="text-xs font-medium truncate flex-1 cursor-pointer">
							{persona.name}
						</Label>
						{isPinned && <PinIcon size={10} className="text-primary flex-shrink-0" />}
					</div>
				</div>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							className="p-0.5 rounded hover:bg-muted/50 focus:outline-none focus:ring-0 transition-colors flex items-center justify-center"
							onClick={(e) => e.stopPropagation()}
						>
							<MoreHorizontalIcon size={10} />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-36">
						<DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
							<EditIcon size={14} className="mr-2" />
							Edit
						</DropdownMenuItem>
						<DropdownMenuItem onClick={handleTogglePin} className="cursor-pointer">
							{isPinned ? (
								<>
									<PinOffIcon size={14} className="mr-2" />
									Unpin
								</>
							) : (
								<>
									<PinIcon size={14} className="mr-2" />
									Pin
								</>
							)}
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={handleDelete}
							className="text-destructive focus:text-destructive cursor-pointer"
						>
							<TrashIcon size={14} className="mr-2" />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}

export function PersonaList() {
	const { personas, isPersonaLoading, hasMorePersona, loadPersonas } = usePlaygroundStore();

	return (
		<ScrollArea className="h-full">
			<div className="px-3 py-2 space-y-2">
				{/* Show skeleton loading on initial load */}
				{isPersonaLoading && personas.length === 0 && (
					<SkeletonLoading lines={4} height="h-12" className="px-2" />
				)}

				{personas.length > 0 && (
					<div className="px-2 py-1 text-xs font-medium text-muted-foreground">
						Available Personas ({personas.length})
					</div>
				)}

				{personas.map((persona) => (
					<PersonaItem key={persona.id} persona={persona} />
				))}

				{/* Show circle loading for pagination */}
				{isPersonaLoading && personas.length > 0 && (
					<div className="flex justify-center py-2">
						<CircleLoading size="small" />
					</div>
				)}

				{/* Show more button */}
				{hasMorePersona && !isPersonaLoading && (
					<button
						onClick={() => loadPersonas()}
						className="w-full flex items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors py-2"
					>
						<ChevronDownIcon size={14} />
						<Label className="text-xs cursor-pointer">Show more</Label>
					</button>
				)}
			</div>

			{/* Empty States */}
			{personas.length === 0 && !isPersonaLoading && (
				<div className="text-center p-6 text-muted-foreground">
					<UserIcon size={40} className="mx-auto mb-3 opacity-30" />
					<h3 className="font-medium text-sm mb-2">No personas yet</h3>
					<p className="text-xs opacity-75">Create your first persona to get started</p>
				</div>
			)}
		</ScrollArea>
	);
}
