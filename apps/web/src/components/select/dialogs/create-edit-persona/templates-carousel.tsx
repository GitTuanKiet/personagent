import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from '@workspace/ui/components/carousel';
import { LayoutTemplateIcon } from 'lucide-react';
import { TighterText } from '@/components/ui/header';
import { TemplateCard } from './template-card';
import type { CreatePersonaData } from '@/types';

interface TemplatesCarouselProps {
	templates: CreatePersonaData[];
	onSelectTemplate: (template: CreatePersonaData) => void;
}

export function TemplatesCarousel({ templates, onSelectTemplate }: TemplatesCarouselProps) {
	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<div className="flex items-center gap-2">
					<LayoutTemplateIcon />
					<TighterText className="text-lg font-medium">Choose from Templates</TighterText>
				</div>
				<p className="text-sm text-muted-foreground">
					Select a pre-configured assistant template to get started quickly
				</p>
			</div>

			<Carousel
				opts={{
					align: 'start',
				}}
				className="w-full"
			>
				<CarouselContent>
					{templates.map((assistant, index) => (
						<CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
							<div className="p-1">
								<TemplateCard assistant={assistant} onSelect={onSelectTemplate} />
							</div>
						</CarouselItem>
					))}
				</CarouselContent>
				<CarouselPrevious />
				<CarouselNext />
			</Carousel>
		</div>
	);
}
