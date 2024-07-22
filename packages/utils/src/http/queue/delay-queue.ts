
import { HttpRequestOptions } from './request';
import FjsPromise from '../../commons/promise';
import { Queue } from './queue';
import ConcurrentQueue from './concurrent-queue';

const DEFAULT_DELAY = 1000;
const DEFAULT_LATEST = true;
const DEFAULT_DELTA = 500;

export default class DelayQueue implements Queue {
  delay: number;
  latest: boolean;
  timer: any;
  queue: any[];
  serials: any[];
  delta: number;

  constructor(delay = DEFAULT_DELAY, latest = DEFAULT_LATEST, delta = -1) {
    this.delay = delay;
    this.latest = latest;
    this.timer = null;
    this.queue = [];
    this.serials = [];
    this.delta = delta == -1 ? this.delay / 2 : delta;
    if (this.delta < DEFAULT_DELTA) {
      this.delta = DEFAULT_DELTA;
    }
  }

  isEmpty = () => {
    return this.serials.length == 0;
  };

  enqueue<T>(options: HttpRequestOptions): FjsPromise<T> {
    return new FjsPromise<T>((resolve, reject) => {
      const timestamp = new Date().getTime();
      this.queue.push({
        options: options,
        resolve: resolve,
        reject: reject,
        timestamp: timestamp,
      });
      this.startRequest();
    });
  }

  private startRequest = () => {
    if (!this.timer) {
      this.timer = setTimeout(() => {
        clearTimeout(this.timer);
        this.timer = null;
        this.startRequestImmediately();
      }, this.delay);
    }
  };

  private isContinually = () => {
    const currentTimestamp = new Date().getTime();
    const timestamps =
      this.queue.map((item) => {
        return item.timestamp;
      }) || [];
    timestamps.push(currentTimestamp);
    if (timestamps.length == 1) {
      return false;
    }
    const deltas = [];
    for (let i = 1; i < timestamps.length; i++) {
      deltas.push(timestamps[i] - timestamps[i - 1]);
    }
    return deltas.every((delta) => {
      return delta < this.delta;
    });
  };

  private startRequestImmediately = () => {
    if (this.latest) {
      if (this.isContinually()) {
        this.startRequest();
      } else {
        if (this.queue && this.queue.length > 0) {
          const latestHttpRequest = this.queue[this.queue.length - 1];
          this.startRequestInQueue([latestHttpRequest]);
        }
      }
    } else {
      this.startRequestInQueue(this.queue || []);
    }
  };

  private startRequestInQueue = (queue: any[]) => {
    queue.forEach((httpRequest) => {
      this.invokeHttpRequest(httpRequest);
      if (this.latest) {
        this.serials.push(httpRequest.timestamp);
      }
    });
    this.queue = [];
  };

  private invokeHttpRequest = (httpRequest: any) => {
    ConcurrentQueue.enqueue(httpRequest.options)
      .then((response) => {
        if (this.latest) {
          const newSerials =
            this.serials.filter((timestamp) => {
              return timestamp > httpRequest.timestamp;
            }) || [];
          if (newSerials.length != this.serials.length) {
            httpRequest.resolve(
              Object.assign({}, response, {
                isDelayQueueEmpty: (newSerials || []).length == 0,
              })
            );
          }
          this.serials = newSerials;
        } else httpRequest.resolve(response);
      })
      .catch((err) => {
        if (this.latest) {
          const newSerials =
            this.serials.filter((timestamp) => {
              return timestamp > httpRequest.timestamp;
            }) || [];
          if (newSerials.length != this.serials.length) {
            httpRequest.reject(
              Object.assign({}, err, {
                isDelayQueueEmpty: (newSerials || []).length == 0,
              })
            );
          }
          this.serials = newSerials;
        } else {
          httpRequest.reject(err);
        }
      });
  };
}