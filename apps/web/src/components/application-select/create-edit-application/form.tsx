import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@workspace/ui/components/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Form } from '@workspace/ui/components/form';
import { GlobeIcon, ListIcon, Cookie as CookieIcon } from 'lucide-react';
import { TighterText } from '@/components/ui/tighter-text';
import {
	createApplicationSchema,
	DEFAULT_APPLICATION_DATA,
	CreateApplicationData,
} from './constants';
import { BasicInfoTab, HeadersTab, CookiesTab } from './tabs';

interface ApplicationFormProps {
	onSubmit: (data: CreateApplicationData) => Promise<void> | void;
	onCancel: () => void;
	disabled?: boolean;
	initialData?: CreateApplicationData;
}

export function ApplicationForm({
	onSubmit,
	onCancel,
	disabled = false,
	initialData,
}: ApplicationFormProps) {
	const [activeTab, setActiveTab] = useState('basic');

	const form = useForm<CreateApplicationData>({
		resolver: zodResolver(createApplicationSchema),
		defaultValues: initialData ?? DEFAULT_APPLICATION_DATA,
	});

	const {
		handleSubmit,
		formState: { isSubmitting },
		reset,
	} = form;

	useEffect(() => {
		reset(initialData ?? DEFAULT_APPLICATION_DATA);
	}, [initialData, reset]);

	return (
		<Form {...form}>
			<form onSubmit={handleSubmit((d) => onSubmit(d))} className="space-y-6">
				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="basic" className="flex items-center gap-2">
							<GlobeIcon className="h-4 w-4" />
							<TighterText>Basic</TighterText>
						</TabsTrigger>
						<TabsTrigger value="headers" className="flex items-center gap-2">
							<ListIcon className="h-4 w-4" />
							<TighterText>Headers</TighterText>
						</TabsTrigger>
						<TabsTrigger value="cookies" className="flex items-center gap-2">
							<CookieIcon className="h-4 w-4" />
							<TighterText>Cookies</TighterText>
						</TabsTrigger>
					</TabsList>

					<TabsContent value="basic" className="space-y-4">
						<BasicInfoTab allDisabled={disabled} />
					</TabsContent>
					<TabsContent value="headers" className="space-y-4">
						<HeadersTab allDisabled={disabled} />
					</TabsContent>
					<TabsContent value="cookies" className="space-y-4">
						<CookiesTab allDisabled={disabled} />
					</TabsContent>
				</Tabs>

				<div className="flex gap-2 justify-end pt-4 border-t">
					<Button
						type="button"
						variant="outline"
						onClick={onCancel}
						disabled={disabled || isSubmitting}
					>
						<TighterText>Cancel</TighterText>
					</Button>
					<Button type="submit" disabled={disabled || isSubmitting}>
						<TighterText>{isSubmitting ? 'Saving...' : 'Save Application'}</TighterText>
					</Button>
				</div>
			</form>
		</Form>
	);
}
