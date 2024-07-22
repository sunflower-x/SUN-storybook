import { Queue } from './queue';
import DelayQueue from './delay-queue';
import ConcurrentQueue from './concurrent-queue';
import SerialQueue from './serial-queue';

export function delayQueue(delay = 1000, latest = true, delta = 500):Queue {
    return new DelayQueue(delay, latest, delta);
}

export function concurrentQueue():Queue  {
    return ConcurrentQueue;
}

export function serialQueue():Queue {
    return new SerialQueue();
}