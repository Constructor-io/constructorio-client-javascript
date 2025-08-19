import { EventEmitter } from './events';

export default class RequestQueue {
  constructor(options: any, eventemitter: EventEmitter);

  options: any;

  eventemitter: EventEmitter;

  humanity: any;

  requestPending: boolean;

  pageUnloading: boolean;

  sendTrackingEvents: boolean;

  queue(url: string, method?: string, body?: any, networkParameters?: any): void;

  sendEvents(): void;

  send(): void;

  static get(): any[];

  static set(queue: any[]): void;

  static remove(): void;
}
