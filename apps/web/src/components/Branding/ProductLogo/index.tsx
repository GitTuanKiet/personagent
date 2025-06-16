import React from 'react';

interface ProductLogoProps {
	size?: number;
	type?: 'combine' | 'separate';
}

export const ProductLogo: React.FC<ProductLogoProps> = ({ size = 24, type = 'combine' }) => (
	<span style={{ display: 'inline-flex', alignItems: 'center', fontWeight: 700, fontSize: 20 }}>
		<span style={{ fontSize: size, marginRight: 6 }} role="img" aria-label="logo">
			{type === 'combine' ? '🧠🧪🧭📊' : '🧠🧪🧭'}
		</span>
		PersonAgent
	</span>
);

export default ProductLogo;
