import HttpConcurrentQueue from './concurrent-queue';
import { Queue } from './queue';
import { HttpRequestOptions } from './request';
import FjsPromise from '../../commons/promise';

const MAX_SIZE = 1;
let idGenerator = 0;

export default class SerialQueue implements Queue {
  queue: any[] = [];
  size: number = 0;

  enqueue<T>(options: HttpRequestOptions): FjsPromise<T> {
    return new FjsPromise<T>((resolve, reject) => {
      this.queue.push({
        id: ++idGenerator,
        options: options,
        resolve: resolve,
        reject: reject,
      });
      this.startRequest();
    });
  }

  removeFromQueue = (id: number) => {
    this.queue = this.queue.filter((item) => {
      return item.id != id;
    });
  };

  requestComplete = () => {
    this.size = this.size - 1;
    if (this.size < 0) {
      this.size = 0;
    }
  };

  private startRequest = () => {
    if (this.size < MAX_SIZE && this.queue && this.queue.length > 0) {
      this.size = this.size + 1;
      const firstHttpAction = this.queue[0];
      this.removeFromQueue(firstHttpAction.id);
      HttpConcurrentQueue.enqueue(firstHttpAction.options)
        .then((response) => {
          this.requestComplete();
          firstHttpAction.resolve(response);
          this.startRequest();
        })
        .catch((err) => {
          this.requestComplete();
          firstHttpAction.reject(err);
          this.startRequest();
        });
    }
  };
}