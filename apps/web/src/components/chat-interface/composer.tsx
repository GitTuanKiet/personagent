'use client';

import { ComposerPrimitive, ThreadPrimitive } from '@assistant-ui/react';
import { type FC, useState, useEffect } from 'react';

import { TooltipIconButton } from '@/components/assistant-ui/tooltip-icon-button';
import { SendHorizontalIcon } from 'lucide-react';
import { DragAndDropWrapper } from './drag-drop-wrapper';
import { ComposerActionsPopOut } from './composer-actions-popout';

const GENERIC_PLACEHOLDERS = [
	'Tìm kiếm sản phẩm iPhone 15',
	'Đăng nhập vào hệ thống với email và password',
	'Tìm kiếm sản phẩm iPhone 15 và thêm vào giỏ hàng',
	'Điền form đăng ký tài khoản mới với thông tin cá nhân',
	'Thực hiện thanh toán đơn hàng bằng thẻ tín dụng',
	'Cập nhật thông tin profile và thay đổi mật khẩu',
	'Tìm kiếm và đặt chỗ khách sạn tại Hà Nội',
	'Upload ảnh đại diện và cập nhật thông tin cá nhân',
	'Tạo bài post mới trên mạng xã hội với hình ảnh',
	'Lọc sản phẩm theo giá và thương hiệu',
	'Thêm sản phẩm vào wishlist và chia sẻ với bạn bè',
	'Điền form liên hệ và gửi tin nhắn hỗ trợ',
	'Đăng ký nhận newsletter và xác nhận email',
	'Tìm kiếm và đặt lịch hẹn với bác sĩ',
	'Thực hiện chuyển khoản ngân hàng online',
];

const getRandomPlaceholder = () => {
	return GENERIC_PLACEHOLDERS[Math.floor(Math.random() * GENERIC_PLACEHOLDERS.length)];
};

const CircleStopIcon = () => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 16 16"
			fill="currentColor"
			width="16"
			height="16"
		>
			<rect width="10" height="10" x="3" y="3" rx="2" />
		</svg>
	);
};

interface ComposerProps {
	chatStarted: boolean;
	isDone: boolean;
}

export const Composer: FC<ComposerProps> = (props: ComposerProps) => {
	const [placeholder, setPlaceholder] = useState('');

	useEffect(() => {
		setPlaceholder(getRandomPlaceholder());
	}, []);

	return (
		<DragAndDropWrapper>
			<ComposerPrimitive.Root className="focus-within:border-ring/20 flex w-full flex-wrap items-end rounded-lg border bg-inherit px-2.5 shadow-sm transition-colors ease-in">
				<div className="flex flex-row w-full items-center justify-start my-auto">
					<ComposerActionsPopOut chatStarted={props.chatStarted} />
					<ComposerPrimitive.Input
						autoFocus
						placeholder={placeholder}
						rows={1}
						className="placeholder:text-muted-foreground overflow-hidden max-h-15 flex-grow resize-none border-none bg-transparent px-2 py-4 text-sm outline-none focus:ring-0 disabled:cursor-not-allowed"
						disabled={props.isDone}
					/>
					<ThreadPrimitive.If running={false}>
						<ComposerPrimitive.Send asChild>
							<TooltipIconButton
								tooltip="Send"
								variant="default"
								className="my-2.5 size-8 p-2 transition-opacity ease-in"
							>
								<SendHorizontalIcon />
							</TooltipIconButton>
						</ComposerPrimitive.Send>
					</ThreadPrimitive.If>
					<ThreadPrimitive.If running>
						<ComposerPrimitive.Cancel asChild>
							<TooltipIconButton
								tooltip="Cancel"
								variant="default"
								className="my-2.5 size-8 p-2 transition-opacity ease-in"
							>
								<CircleStopIcon />
							</TooltipIconButton>
						</ComposerPrimitive.Cancel>
					</ThreadPrimitive.If>
				</div>
			</ComposerPrimitive.Root>
		</DragAndDropWrapper>
	);
};
