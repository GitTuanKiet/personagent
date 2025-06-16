import React from 'react';
import { SimulationSelect } from '@/database/client/schema';

export interface TerminalState {
	state?: SimulationSelect['state'];
}

export interface TabConfig {
	label: string;
	icon: React.ComponentType<{ size?: number; className?: string }>;
	value: string;
	badge: 'default' | 'secondary' | 'destructive' | 'outline';
	counter: (state?: SimulationSelect['state']) => number;
	content: (state?: SimulationSelect['state']) => React.ReactElement;
}

export type TerminalPosition = 'right' | 'bottom';
