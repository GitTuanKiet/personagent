'use client';

import { usePlaygroundStore } from '@/store/playground';
import { CreateApplicationForm } from './CreateApplicationForm';
import { useEditApplicationDialog } from '@/store/user/selectors';

// Main component that handles both create and edit modes
export default function ApplicationDialog() {
	const { editingApplication } = usePlaygroundStore();
	const { isOpen: isEditOpen } = useEditApplicationDialog();

	// For edit mode with editing application
	if (isEditOpen && editingApplication) {
		return (
			<CreateApplicationForm
				initialData={editingApplication}
				isEditMode={true}
				applicationId={editingApplication.id}
			/>
		);
	}

	// For create mode
	return <CreateApplicationForm />;
}
