import {
    ajax as _ajax,
    get as _get,
    post as _post,
    mock,
    resultObject as _resultObject,
    Get,
    Post,
    Ajax,
    ResultObject,
  } from './http';
  
  import { curryN } from 'ramda';
  
  export type { Queue } from './queue/queue';
  
  export * from './queue/index';
  
  export { HttpEventManager } from './manager';
  export type { HttpEventHandler } from './manager';
  
  export { HttpResponseError } from './queue/request';
  
  export type { HttpResponse } from './http';
  
  /**
   * ajax请求
   * @param options ajax请求配制体，具体可查看
   * @returns FjsPromise<HttpResponse>, reject: HttpResponseError { type, error, message },
   *          1 type: API_ERROR(业务处理错误), error: 业务返回的错误结果 HttpResponse
   *          2 type: NETWORK_ERROR(网络请求错误), error: Error对象
   *          3 type: SERVER_ERROR(服务器异常错误) error: 服务器返回的异常结果 HttpResponse
   */
  export const ajax = curryN(1, _ajax) as Ajax;
  
  /**
   * curry(get) 柯里化的get请求
   * @param url:string 网络请求地址
   * @param params:any 网络请求参数，举例：{ brandId: 10029, userId: 1 }
   * @returns FjsPromise<HttpResponse>, reject: HttpResponseError { type, error, message },
   *          1 type: API_ERROR(业务处理错误), error: 业务返回的错误结果 HttpResponse
   *          2 type: NETWORK_ERROR(网络请求错误), error: Error对象
   *          3 type: SERVER_ERROR(服务器异常错误) error: 服务器返回的异常结果 HttpResponse
   */
  export const get = curryN(2, _get) as Get;
  
  /**
   * curry(post) 柯里化的post请求
   * @param url:string 网络请求地址
   * @param params:any 网络请求参数，举例：{ brandId: 10029, userId: 1 }
   * @returns FjsPromise<HttpResponse>, reject: HttpResponseError { type, error, message },
   *          1 type: API_ERROR(业务处理错误), error: 业务返回的错误结果 HttpResponse
   *          2 type: NETWORK_ERROR(网络请求错误), error: Error对象
   *          3 type: SERVER_ERROR(服务器异常错误) error: 服务器返回的异常结果 HttpResponse
   */
  export const post = curryN(2, _post) as Post;
  
  export const resultObject = curryN(2, _resultObject) as ResultObject;
  
  import { delayQueue, concurrentQueue, serialQueue } from './queue/index';
  
  export default class Http {
    static get = get;
    static post = post;
    static ajax = ajax;
    static mock = mock;
    static resultObject = resultObject;
    static Queue = {
      delayQueue,
      concurrentQueue,
      serialQueue,
    };
  }
  