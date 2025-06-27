'use client';

import { motion, AnimatePresence, Variants } from 'framer-motion';
import { CirclePlus, Globe } from 'lucide-react';
import { useState } from 'react';
import { PersonaSelect } from '../select';
import { TooltipIconButton } from '../assistant-ui/tooltip-icon-button';
import { cn } from '@workspace/ui/lib/utils';
import { useAssistantContext } from '@/contexts/assistant-context';

interface ComposerActionsPopOutProps {
	userId: string | undefined;
	chatStarted: boolean;
}

export function ComposerActionsPopOut(props: ComposerActionsPopOutProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [isPersonaSelectOpen, setIsPersonaSelectOpen] = useState(false);
	const [isMouseOver, setIsMouseOver] = useState(false);
	const { selectedAssistant } = useAssistantContext();
	const isDefaultSelected = !!selectedAssistant?.metadata?.is_default;

	const containerVariants: Variants = {
		collapsed: {
			width: !isDefaultSelected ? '120px' : '40px',
			transition: {
				type: 'spring',
				stiffness: 500,
				damping: 30,
			},
		},
		expanded: {
			width: '160px',
			transition: {
				type: 'spring',
				stiffness: 500,
				damping: 30,
			},
		},
	};

	const iconsContainerVariants: Variants = {
		collapsed: {
			opacity: 0,
			x: -20,
			transition: {
				duration: 0.2,
			},
		},
		expanded: {
			opacity: 1,
			x: 0,
			transition: {
				duration: 0.2,
				delay: 0.1,
			},
		},
	};

	return (
		<motion.div
			onMouseEnter={() => {
				setIsMouseOver(true);
				setIsExpanded(true);
			}}
			onMouseLeave={() => {
				setIsMouseOver(false);
				if (!isPersonaSelectOpen) {
					setIsExpanded(false);
				}
			}}
		>
			<motion.div
				className="rounded-full flex items-center h-8 justify-start px-2 py-5 bg-blue-50 overflow-hidden"
				variants={containerVariants}
				animate={isExpanded ? 'expanded' : 'collapsed'}
				initial="collapsed"
			>
				<div className="flex items-center gap-2">
					<CirclePlus
						className={cn(
							'size-6 flex-shrink-0',
							isExpanded && 'opacity-60 transition-all ease-in-out',
						)}
					/>
					{!isDefaultSelected && (
						<PersonaSelect
							userId={props.userId}
							chatStarted={props.chatStarted}
							className="bg-blue-100 hover:bg-blue-100 transition-colors ease-in-out"
							onOpenChange={(isOpen) => {
								setIsPersonaSelectOpen(isOpen);
								if (!isOpen && !isMouseOver) {
									setIsExpanded(false);
								}
							}}
						/>
					)}
				</div>

				<AnimatePresence>
					{isExpanded && (
						<motion.div
							className="flex items-center justify-center gap-2 ml-2"
							variants={iconsContainerVariants}
							initial="collapsed"
							animate="expanded"
							exit="collapsed"
						>
							{isDefaultSelected && (
								<PersonaSelect
									userId={props.userId}
									chatStarted={props.chatStarted}
									className="hover:bg-blue-100 transition-colors ease-in-out"
									onOpenChange={(isOpen) => {
										setIsPersonaSelectOpen(isOpen);
										if (!isOpen && !isMouseOver) {
											setIsExpanded(false);
										}
									}}
								/>
							)}
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>
		</motion.div>
	);
}
