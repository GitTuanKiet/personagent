import { Button } from '@workspace/ui/components/button';
import React from 'react';

import ErrorResult from '@/components/InitClientDB/ErrorResult';

const InitError = () => {
	return (
		<ErrorResult>
			{({ setOpen }) => (
				<div className="flex flex-col gap-8">
					Đã xảy ra lỗi khi khởi tạo. Vui lòng thử lại hoặc xem chi tiết.
					<div>
						<Button onClick={() => setOpen(true)} type="button">
							Xem chi tiết
						</Button>
					</div>
				</div>
			)}
		</ErrorResult>
	);
};

export default InitError;
