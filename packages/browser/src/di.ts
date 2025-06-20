import 'reflect-metadata';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructable<T = unknown> = new (...args: any[]) => T;
type AbstractConstructable<T = unknown> = abstract new (...args: unknown[]) => T;
type ServiceIdentifier<T = unknown> = Constructable<T> | AbstractConstructable<T>;

type Instance<T = unknown> = T | undefined;

const instances = new Map<ServiceIdentifier, Instance>();

/**
 * Decorator that marks a class as available for dependency injection.
 * @returns A class decorator to be applied to the target class
 */
export function singleton<T>() {
	return function (target: Constructable<T>) {
		instances.set(target, undefined);
		return target;
	};
}

class DIError extends Error {
	constructor(message: string) {
		super(`[DI] ${message}`);
	}
}

class ContainerClass {
	/** Stack to track types being resolved to detect circular dependencies */
	private readonly resolutionStack: ServiceIdentifier[] = [];

	/**
	 * Checks if a type is registered in the container
	 * @template T The type to check for
	 * @param type The constructor of the type to check
	 * @returns True if the type is registered (has metadata), false otherwise
	 */
	has<T>(type: ServiceIdentifier<T>): boolean {
		return instances.has(type);
	}

	/**
	 * Retrieves or creates an instance of the specified type from the container
	 * @template T The type of instance to retrieve
	 * @param type The constructor of the type to retrieve
	 * @returns An instance of the specified type with all dependencies injected
	 * @throws {DIError} If circular dependencies are detected or if the type is not injectable
	 */
	get<T>(type: ServiceIdentifier<T>): T {
		const { resolutionStack } = this;

		if (!instances.has(type)) {
			// Special case: Allow undefined returns for non-decorated constructor params
			// when resolving a dependency chain (i.e., resolutionStack not empty)
			if (resolutionStack.length) return undefined as T;
			throw new DIError(`${type.name} is not decorated with ${singleton.name}`);
		}

		const instance = instances.get(type) as Instance<T>;

		if (instance) return instance as T;

		// Add current type to resolution stack before resolving dependencies
		resolutionStack.push(type);

		try {
			const paramTypes = (Reflect.getMetadata('design:paramtypes', type) ?? []) as Constructable[];

			const dependencies = paramTypes.map(<P>(paramType: Constructable<P>, index: number) => {
				if (paramType === undefined) {
					throw new DIError(
						`Circular dependency detected in ${type.name} at index ${index}.\n${resolutionStack.map((t) => t.name).join(' -> ')}\n`,
					);
				}
				return this.get(paramType);
			});

			const instance = new (type as Constructable)(...dependencies) as T;

			instances.set(type, instance);
			return instance;
		} catch (error) {
			if (error instanceof TypeError && error.message.toLowerCase().includes('abstract')) {
				throw new DIError(`${type.name} is an abstract class, and cannot be instantiated`);
			}
			throw error;
		} finally {
			resolutionStack.pop();
		}
	}

	/**
	 * Manually sets an instance for a specific type in the container
	 * @template T The type of instance being set
	 * @param type The constructor of the type to set. This can also be an abstract class
	 * @param instance The instance to store in the container
	 */
	set<T>(type: ServiceIdentifier<T>, instance: T): void {
		// Preserve any existing metadata (like factory) when setting new instance
		const metadata = instances.get(type) ?? {};
		instances.set(type, { ...metadata, instance });
	}

	/** Clears all instantiated instances from the container while preserving type registrations */
	reset(): void {
		instances.clear();
	}
}

/**
 * Global dependency injection container instance
 * Used to retrieve and manage class instances and their dependencies
 */
export const container = new ContainerClass();
