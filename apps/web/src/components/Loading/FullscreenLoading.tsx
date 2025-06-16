import React, { ReactNode, memo } from 'react';

import { ProductLogo } from '@/components/Branding';
import InitProgress, { StageItem } from '@/components/InitProgress';

interface FullscreenLoadingProps {
	activeStage: number;
	contentRender?: ReactNode;
	stages: StageItem[];
}

const FullscreenLoading = memo<FullscreenLoadingProps>(({ activeStage, stages, contentRender }) => {
	return (
		<div className="h-full w-full flex relative select-none">
			<div className="flex-1 flex items-center justify-center gap-4 w-full flex-col">
				<ProductLogo size={48} type={'combine'} />
				{contentRender ? contentRender : <InitProgress activeStage={activeStage} stages={stages} />}
			</div>
		</div>
	);
});

export default FullscreenLoading;
