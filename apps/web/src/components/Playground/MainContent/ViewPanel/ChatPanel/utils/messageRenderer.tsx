import React from 'react';
import { MessageContent, MessageContentComplex } from '../types';

export const renderMessageContent = (
	content: MessageContent,
	isUser: boolean = false,
): React.ReactElement => {
	let contentComplex: MessageContentComplex[] = [];

	if (typeof content === 'string') {
		return (
			<div
				className={`rounded-2xl px-3 py-2 max-w-sm break-words ${
					isUser ? 'bg-blue-500 text-white ml-auto' : 'bg-gray-100 text-gray-900'
				}`}
			>
				<p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
			</div>
		);
	}

	contentComplex = content;
	let texts: string[] = [];
	let imageUrls: string[] = [];

	for (const item of contentComplex) {
		if (item.type === 'text') {
			texts.push(item.text);
		} else if (item.type === 'image_url') {
			imageUrls.push(item.image_url.url);
		}
	}

	const hasImages = imageUrls.length > 0;
	const hasText = texts.length > 0 && texts.some((text) => text.trim());

	return (
		<div className={`max-w-sm ${isUser ? 'ml-auto' : ''}`}>
			{/* Images Container - Messenger style */}
			{hasImages && (
				<div className="relative mb-1">
					{imageUrls.length === 1 ? (
						<div className="rounded-2xl overflow-hidden bg-gray-100">
							<img
								src={imageUrls[0]}
								alt="Message Image"
								className="w-full h-auto max-h-64 object-cover"
								onError={(e) => {
									e.currentTarget.src =
										'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%236b7280">Image not found</text></svg>';
								}}
							/>
						</div>
					) : (
						<div
							className={`grid gap-1 rounded-2xl overflow-hidden ${
								imageUrls.length === 2
									? 'grid-cols-2'
									: imageUrls.length === 3
										? 'grid-cols-2'
										: 'grid-cols-2'
							}`}
						>
							{imageUrls.slice(0, 4).map((url, index) => (
								<div key={index} className="relative bg-gray-100">
									<img
										src={url}
										alt={`Message Image ${index + 1}`}
										className="w-full h-24 object-cover"
										onError={(e) => {
											e.currentTarget.src =
												'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%236b7280" font-size="10">Error</text></svg>';
										}}
									/>
									{/* Show "+N more" overlay for last image if more than 4 */}
									{index === 3 && imageUrls.length > 4 && (
										<div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
											<span className="text-white text-xs font-medium">
												+{imageUrls.length - 4} more
											</span>
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Text Container - Overlaps images slightly for Messenger style */}
			{hasText && (
				<div
					className={`rounded-2xl px-3 py-2 break-words ${hasImages ? '-mt-2 relative z-10' : ''} ${
						isUser ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'
					}`}
				>
					<p className="text-sm leading-relaxed whitespace-pre-wrap">{texts.join('\n')}</p>
				</div>
			)}
		</div>
	);
};
