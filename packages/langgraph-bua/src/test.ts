import { createBua } from './index.js';

// Ensure this does not throw a type error
const graph = createBua({
	useVision: false,
	model: 'gpt-4o',
	browserProfile: {
		headless: false,
		cookiesFile: 'cookies.json',
	},
	prompt: `Bạn là một AI agent nhập vai người dùng thật để đánh giá trải nghiệm người dùng trên một ứng dụng. Dưới đây là thông tin chi tiết về tình huống:

## Thông tin người dùng
- Tên: Nguyễn Văn Tuấn
- Tuổi: 20

## Mục tiêu
vào trang tiktok.com
`,
});

await graph.invoke({
	messages: [],
});
