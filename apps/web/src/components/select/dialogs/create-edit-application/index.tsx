'use client';

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@workspace/ui/components/dialog';
import { TighterText } from '@/components/ui/header';
import { ApplicationForm } from './form';
import type { CreateApplicationData } from '@/types';
import type { Application } from '@/types';
import type {
	EditCustomApplicationArgs,
	CreateCustomApplicationArgs,
} from '@/contexts/application-context';

export interface CreateEditApplicationDialogProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	userId?: string;
	isEditing: boolean;
	application?: Application;
	createCustomApplication: (args: CreateCustomApplicationArgs) => Promise<Application | undefined>;
	editCustomApplication: (args: EditCustomApplicationArgs) => Promise<Application | undefined>;
	isLoading?: boolean;
	allDisabled?: boolean;
	setAllDisabled?: (disabled: boolean) => void;
}

export function CreateEditApplicationDialog(props: CreateEditApplicationDialogProps) {
	const handleDialogClose = () => {
		props.setOpen(false);
	};

	const handleFormSubmit = async (data: CreateApplicationData): Promise<boolean> => {
		if (props.setAllDisabled) {
			props.setAllDisabled(true);
		}

		try {
			let success = false;

			if (props.isEditing && props.application) {
				const res = await props.editCustomApplication({
					editedApplication: data,
					applicationId: props.application.id,
				});
				success = !!res;
			} else {
				const res = await props.createCustomApplication({
					newApplication: data,
				});
				success = !!res;
			}

			if (success) {
				handleDialogClose();
			}

			return success;
		} finally {
			if (props.setAllDisabled) {
				props.setAllDisabled(false);
			}
		}
	};

	const handleFormCancel = () => {
		handleDialogClose();
	};

	if (props.isEditing && !props.application) {
		return null;
	}

	return (
		<Dialog open={props.open} onOpenChange={handleDialogClose}>
			<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						<TighterText className="text-xl font-semibold">
							{props.isEditing ? 'Edit Application' : 'Create New Application'}
						</TighterText>
					</DialogTitle>
					<DialogDescription>
						{props.isEditing
							? 'Update your application settings and configuration.'
							: 'Create a new application to test with AI agents.'}
					</DialogDescription>
				</DialogHeader>

				<ApplicationForm
					userId={props.userId}
					isEditing={props.isEditing}
					application={props.application}
					onSubmit={handleFormSubmit}
					onCancel={handleFormCancel}
					isLoading={props.isLoading}
					disabled={props.allDisabled}
				/>
			</DialogContent>
		</Dialog>
	);
}

export default CreateEditApplicationDialog;
