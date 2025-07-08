import { useState } from 'react';
import { ApplicationForm } from './form';
import { CreateApplicationData } from './constants';
import { storeApplication, updateApplication, Application } from '@/lib/appApi';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@workspace/ui/components/dialog';
import { TighterText } from '@/components/ui/tighter-text';

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCreate?: (app: Application) => void;
	onUpdate?: (app: Application) => void;
	application?: Application;
}

export const ApplicationCreateEditDialog = ({
	open,
	onOpenChange,
	onCreate,
	onUpdate,
	application,
}: Props) => {
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (data: CreateApplicationData) => {
		setLoading(true);
		try {
			let app: Application | undefined;
			if (application) {
				app = await updateApplication(application.id, data);
				if (app) onUpdate?.(app);
			} else {
				app = await storeApplication(data);
				onCreate?.(app);
			}
			onOpenChange(false);
		} catch (err) {
			alert('Lỗi khi lưu application');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-2xl font-light text-gray-800">
						<TighterText>
							{application ? `Edit Application: ${application.name}` : 'Create New Application'}
						</TighterText>
					</DialogTitle>
					<DialogDescription className="text-sm text-gray-600">
						<TighterText>
							{application
								? 'Update your application settings.'
								: 'Define details for a new application (URL, headers, cookies...)'}
						</TighterText>
					</DialogDescription>
				</DialogHeader>

				<ApplicationForm
					onSubmit={handleSubmit}
					onCancel={() => onOpenChange(false)}
					disabled={loading}
					initialData={
						application
							? {
									name: application.name,
									url: application.url,
									headers: application.headers ?? {},
									cookies: application.cookies ?? '',
								}
							: undefined
					}
				/>
			</DialogContent>
		</Dialog>
	);
};
