export = EventDispatcher;

declare class EventDispatcher {
	constructor(options: IConstructorClientOptions);
	events: { name: string; data: Record<string, any> }[];
	enabled: boolean;
	waitForBeacon: boolean;
	active: boolean;
	queue(name: string, data: Record<string, any>): void;
	dispatchEvents(): void;
}
