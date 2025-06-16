import os from 'node:os';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import type { ViewportSize } from 'patchright';
import { DEFAULT_VIEWPORT } from './const';

let cachedDisplaySize: ViewportSize | null = null;
let cachedIsDocker: boolean | null = null;

export function getDisplaySize(): ViewportSize | null {
	if (cachedDisplaySize) return cachedDisplaySize;

	const platform = os.platform();
	try {
		if (platform === 'win32') {
			try {
				const out = execSync(
					'wmic path Win32_VideoController get CurrentHorizontalResolution,CurrentVerticalResolution',
				)
					.toString()
					.split('\n')
					.find((line) => /\d+/.test(line));
				if (out) {
					const [width, height] = out.trim().split(/\s+/).map(Number);
					if (width && height) cachedDisplaySize = { width, height };
				}
			} catch {}
		} else if (platform === 'darwin') {
			const out = execSync('system_profiler SPDisplaysDataType')
				.toString()
				.match(/Resolution: (\d+) x (\d+)/);
			if (out) {
				const [, width, height] = out;
				if (width && height) cachedDisplaySize = { width: +width, height: +height };
			}
		} else if (platform === 'linux') {
			try {
				execSync('which xrandr');
			} catch {
				return null;
			}
			if (!process.env.DISPLAY) return null;
			const out = execSync("xrandr | grep '*' | awk '{print $1}'", { timeout: 3000 }).toString();
			const match = out.match(/(\d+)x(\d+)/);
			if (match) {
				const [, width, height] = match;
				if (width && height) cachedDisplaySize = { width: +width, height: +height };
			}
		}
	} catch {}

	if (cachedDisplaySize && cachedDisplaySize.width > 1920) {
		cachedDisplaySize = DEFAULT_VIEWPORT;
	}

	return cachedDisplaySize;
}

export function isDocker(): boolean {
	if (cachedIsDocker) return cachedIsDocker;

	if (existsSync('/.dockerenv') || existsSync('/run/.containerenv')) {
		cachedIsDocker = true;
		return cachedIsDocker;
	}
	try {
		const cgroupV1 = readFileSync('/proc/self/cgroup', 'utf8');
		if (
			cgroupV1.includes('docker') ||
			cgroupV1.includes('kubepods') ||
			cgroupV1.includes('containerd')
		)
			cachedIsDocker = true;
	} catch {}
	try {
		const cgroupV2 = readFileSync('/proc/self/mountinfo', 'utf8');
		if (
			cgroupV2.includes('docker') ||
			cgroupV2.includes('kubelet') ||
			cgroupV2.includes('containerd')
		)
			cachedIsDocker = true;
	} catch {}
	cachedIsDocker = false;

	return cachedIsDocker;
}
