import { ThreadPrimitive, useThreadRuntime } from '@assistant-ui/react';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import { FC, useMemo } from 'react';
import { TighterText } from '../ui/header';
import { Button } from '@workspace/ui/components/button';
import { ApplicationSelect, PersonaSelect } from '../select';

const QUICK_START_PROMPTS = [
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

function getRandomPrompts(prompts: string[], count: number = 4): string[] {
	return [...prompts].sort(() => Math.random() - 0.5).slice(0, count);
}

const QuickStartPrompts = () => {
	const threadRuntime = useThreadRuntime();

	const handleClick = (text: string) => {
		threadRuntime.append({
			role: 'user',
			content: [{ type: 'text', text }],
		});
	};

	const selectedPrompts = useMemo(() => getRandomPrompts(QUICK_START_PROMPTS), []);

	return (
		<div className="flex flex-col w-full gap-2">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
				{selectedPrompts.map((prompt, index) => (
					<Button
						key={`quick-start-prompt-${index}`}
						onClick={() => handleClick(prompt)}
						variant="outline"
						className="min-h-[60px] w-full flex items-center justify-center p-6 whitespace-normal text-gray-500 hover:text-gray-700 transition-colors ease-in rounded-2xl"
					>
						<p className="text-center break-words text-sm font-normal">{prompt}</p>
					</Button>
				))}
			</div>
		</div>
	);
};

interface QuickStartButtonsProps {
	composer: React.ReactNode;
	userId?: string;
	chatStarted?: boolean;
}

const QuickStartButtons = (props: QuickStartButtonsProps) => {
	return (
		<div className="flex flex-col gap-8 items-center justify-center w-full">
			<div className="flex flex-col gap-6">
				<p className="text-gray-600 text-sm">Start by selecting application and persona</p>
				<div className="flex flex-row gap-4 items-center justify-center w-full">
					<ApplicationSelect
						userId={props.userId}
						chatStarted={props.chatStarted || false}
						className="w-fit"
					/>
					<PersonaSelect
						userId={props.userId}
						chatStarted={props.chatStarted || false}
						className="w-fit"
					/>
				</div>
			</div>
			<div className="flex flex-col gap-6 mt-2 w-full">
				<p className="text-gray-600 text-sm">then with a task</p>
				{props.composer}
				<QuickStartPrompts />
			</div>
		</div>
	);
};

interface ThreadWelcomeProps {
	composer: React.ReactNode;
	userId?: string;
	chatStarted?: boolean;
}

export const ThreadWelcome: FC<ThreadWelcomeProps> = (props: ThreadWelcomeProps) => {
	return (
		<ThreadPrimitive.Empty>
			<div className="flex items-center justify-center mt-16 w-full">
				<div className="text-center max-w-3xl w-full">
					<Avatar className="mx-auto">
						<AvatarImage src="/window.svg" alt="Window Logo" />
						<AvatarFallback>W</AvatarFallback>
					</Avatar>
					<TighterText className="mt-4 text-lg font-medium">
						Bạn muốn mô phỏng trải nghiệm người dùng nào hôm nay?
					</TighterText>
					<div className="mt-8 w-full">
						<QuickStartButtons
							composer={props.composer}
							userId={props.userId}
							chatStarted={props.chatStarted}
						/>
					</div>
				</div>
			</div>
		</ThreadPrimitive.Empty>
	);
};
