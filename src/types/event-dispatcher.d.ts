import { ConstructorClientOptions } from "./types";

export = EventDispatcher;

declare class EventDispatcher {
	constructor(options: ConstructorClientOptions);
	events: { name: string; data: Record<string, any> }[];
	enabled: boolean;
	waitForBeacon: boolean;
	active: boolean;
	queue(name: string, data: Record<string, any>): void;
	dispatchEvents(): void;
}
