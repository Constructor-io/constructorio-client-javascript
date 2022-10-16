import ConstructorIO from './constructorio'

export interface IConstructorClientOptions {
	apiKey: string;
	version?: string;
	serviceUrl?: string;
	// session id is of type string in jsdocs but of type number in code usage
	sessionId?: string;
	clientId?: string;
	userId?: string;
	segments?: string[];
	testCells?: Record<string, string>;
	fetch?: any;
	trackingSendDelay?: number;
	sendTrackingEvents?: boolean;
	sendReferrerWithTrackingEvents?: boolean;
	eventDispatcher?: EventDispatcher;
	beaconMode?: boolean;
	networkParameters?: {
		timeout: number;
	};
}

export = ConstructorIO