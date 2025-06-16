import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from '@workspace/ui/components/carousel';
import { LayoutTemplateIcon } from 'lucide-react';
import { TemplateCard } from './TemplateCard';
import { TemplatesCarouselProps } from './types';

export function TemplatesCarousel({ templates, onSelectTemplate }: TemplatesCarouselProps) {
	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<LayoutTemplateIcon className="h-5 w-5" />
				<h3 className="text-lg font-medium">Templates</h3>
			</div>
			<Carousel
				opts={{
					align: 'start',
				}}
				className="w-full"
			>
				<CarouselContent>
					{templates.map((persona, index) => (
						<CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
							<div className="p-1">
								<TemplateCard persona={persona} onSelect={onSelectTemplate} />
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
