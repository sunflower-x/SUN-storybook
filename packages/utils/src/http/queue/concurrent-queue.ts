import { request, HttpRequestOptions } from './request';
import FjsPromise from '../../commons/promise';
import { Queue } from './queue';

const MAX_SIZE = 4;

let idGenerator = 0;

class HttpConcurrentQueueImpl implements Queue {
  queue: any[];
  maxSize: number;
  size: number;

  constructor(maxSize = MAX_SIZE) {
    this.maxSize = maxSize;
    this.queue = [];
    this.size = 0;
  }

  enqueue<T>(options: HttpRequestOptions): FjsPromise<T> {
    return new FjsPromise<T>((resolve, reject) => {
      this.queue.push({
        // 请求入队列
        id: ++idGenerator, // 请求对应的id
        options: options, // 请求参数
        resolve: resolve, // fulfilled
        reject: reject, // rejected
      });
      this.invokeRequest(); // 促发请求
    });
  }

  private invokeRequest() {
    // 请求数没有达到最大值，并且队列中有请求，则发送请求
    if (this.size <= this.maxSize && this.queue && this.queue.length > 0) {
      // 请求数目+1
      this.size = this.size + 1;

      // 获取队列头
      const requestOptions = this.queue[0];

      // 从队列中移除当前request
      this.queue = this.queue.filter((item) => item.id != requestOptions.id) || [];

      // 发送网络请求
      request(requestOptions.options)
        .then((response) => {
          this.finishRequest();
          requestOptions.resolve(response);
          this.invokeRequest(); // 如果队列中还有请求，则发送请求
        })
        .catch((err) => {
          this.finishRequest();
          requestOptions.reject(err);
          this.invokeRequest(); // 如果队列中还有请求，则发送请求
        });
    }
  }

  private finishRequest() {
    // 请求数-1
    this.size = this.size - 1;
    if (this.size < 0) {
      this.size = 0;
    }
  }
}

export default new HttpConcurrentQueueImpl() as Queue;


