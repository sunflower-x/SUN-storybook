import FjsPromise from '../commons/promise';
import { default as HttpConcurrentQueue } from './queue/concurrent-queue';
import { HttpRequestOptions, HttpResponseError } from './queue/request';
import prop from '../commons/prop';
import { curryN } from 'ramda';

const SUCCESS = 'success';
const API_ERROR = 'API_ERROR';

const HTTP_METHOD_GET = 'GET';
const HTTP_METHOD_POST = 'POST';

/**
 * http请求结果
 */
export interface HttpResponse<T = any> {
  /**
   * 处理状态，success为成功
   */
  status?: string;

  /**
   * 处理结果编码
   */
  resultCode?: string;

  /**
   * 处理结果
   */
  resultObject?: T;

  /**
   * 处理信息，一般用于页面显示
   */
  message?: string;

  /**
   * 异常信息，服务器出错信息
   */
  exceptionMessage?: string;

  /**
   * http状态码
   */
  httpStatus?: number;

  /**
   * http状态码文本
   */
  httpStatusText?: string;

  /**
   * 处理结果扩展信息，一般用不到，具体情况看服务器接口文档
   */
  extPara?: any;

  /**
   * 异常等级，主要用于框架http错误日志报告，开发者可以忽略
   */
  exceptionLevel?: string;

  /**
   * 用于错误跟踪，可以用traceid在log日志平台查看出错信息：http://log.dianjia.io/log/index.html
   */
  traceid?: string;
}

export interface Ajax {
  /**
   * ajax接口
   * @param options ajax请求配制体，具体可查看
   * @returns FjsPromise<HttpResponse>, reject: HttpResponseError { type, error, message }
   *          1 type: API_ERROR(业务处理错误), error: 业务返回的错误结果 HttpResponse
   *          2 type: NETWORK_ERROR(网络请求错误), error: Error对象
   *          3 type: SERVER_ERROR(服务器异常错误) error: 服务器返回的异常结果 HttpResponse
   */
  (options: HttpRequestOptions): FjsPromise<HttpResponse>;
}

/**
 * ajax请求
 * @param options ajax请求配制体，具体可查看
 * @returns FjsPromise<HttpResponse>, reject: HttpResponseError { type, error, message },
 *          1 type: API_ERROR(业务处理错误), error: 业务返回的错误结果 HttpResponse
 *          2 type: NETWORK_ERROR(网络请求错误), error: Error对象
 *          3 type: SERVER_ERROR(服务器异常错误) error: 服务器返回的异常结果 HttpResponse
 */
export function ajax(options: HttpRequestOptions): FjsPromise<HttpResponse> {
  return new FjsPromise<HttpResponse>((resolve, reject: (reason: HttpResponseError) => void) => {
    HttpConcurrentQueue.enqueue<HttpResponse>(options)
      .then((response) => {
        if (response.status == SUCCESS) {
          resolve(response);
        } else {
          reject(
            new HttpResponseError(
              API_ERROR,
              response.message || response.exceptionMessage || '',
              response
            )
          );
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export interface Request2 {
  /**
   * 请求接口
   * @param url:string 网络请求地址
   * @param params:any 网络请求参数，举例：{ brandId: 10029, userId: 1 }
   * @returns FjsPromise<HttpResponse>, reject: HttpResponseError { type, error, message },
   *          1 type: API_ERROR(业务处理错误), error: 业务返回的错误结果 HttpResponse
   *          2 type: NETWORK_ERROR(网络请求错误), error: Error对象
   *          3 type: SERVER_ERROR(服务器异常错误) error: 服务器返回的异常结果 HttpResponse
   */
  (url: string, params: any): FjsPromise<HttpResponse>;
}

export interface Request1 {
  /**
   * 请求接口
   * @param url:string 网络请求地址
   * @returns (params) => FjsPromise<HttpResponse>
   *
   * params:any 网络请求参数，举例：{ brandId: 10029, userId: 1 }
   *
   * FjsPromise<HttpResponse>, reject: HttpResponseError { type, error, message },
   *          1 type: API_ERROR(业务处理错误), error: 业务返回的错误结果 HttpResponse
   *          2 type: NETWORK_ERROR(网络请求错误), error: Error对象
   *          3 type: SERVER_ERROR(服务器异常错误) error: 服务器返回的异常结果 HttpResponse
   */
  (url: string): (params: any) => FjsPromise<HttpResponse>;
}

/**
 * curry(post) 柯里化的post请求
 * @param url:string 网络请求地址
 * @param params:any 网络请求参数，举例：{ brandId: 10029, userId: 1 }
 * @returns FjsPromise<HttpResponse>, reject: HttpResponseError { type, error, message },
 *          1 type: API_ERROR(业务处理错误), error: 业务返回的错误结果 HttpResponse
 *          2 type: NETWORK_ERROR(网络请求错误), error: Error对象
 *          3 type: SERVER_ERROR(服务器异常错误) error: 服务器返回的异常结果 HttpResponse
 */
export type Post = Request1 & Request2;

/**
 * http post 请求
 * @param url:string 网络请求地址
 * @param params:any 网络请求参数，举例：{ brandId: 10029, userId: 1 }
 * @returns FjsPromise<HttpResponse>, reject: HttpResponseError { type, error, message },
 *          1 type: API_ERROR(业务处理错误), error: 业务返回的错误结果 HttpResponse
 *          2 type: NETWORK_ERROR(网络请求错误), error: Error对象
 *          3 type: SERVER_ERROR(服务器异常错误) error: 服务器返回的异常结果 HttpResponse
 */
export function post(url: string, params: any): FjsPromise<HttpResponse> {
  return ajax({
    url,
    method: HTTP_METHOD_POST,
    data: params,
  });
}

/**
 * curry(get) 柯里化的get请求
 * @param url:string 网络请求地址
 * @param params:any 网络请求参数，举例：{ brandId: 10029, userId: 1 }
 * @returns FjsPromise<HttpResponse>, reject: HttpResponseError { type, error, message },
 *          1 type: API_ERROR(业务处理错误), error: 业务返回的错误结果 HttpResponse
 *          2 type: NETWORK_ERROR(网络请求错误), error: Error对象
 *          3 type: SERVER_ERROR(服务器异常错误) error: 服务器返回的异常结果 HttpResponse
 */
export type Get = Request1 & Request2;

/**
 * http get 请求
 * @param url:string 网络请求地址
 * @param params:any 网络请求参数，举例：{ brandId: 10029, userId: 1 }
 * @returns FjsPromise<HttpResponse>, reject: HttpResponseError { type, error, message },
 *          1 type: API_ERROR(业务处理错误), error: 业务返回的错误结果 HttpResponse
 *          2 type: NETWORK_ERROR(网络请求错误), error: Error对象
 *          3 type: SERVER_ERROR(服务器异常错误) error: 服务器返回的异常结果 HttpResponse
 */
export function get(url: string, params: any): FjsPromise<HttpResponse> {
  return ajax({
    url,
    method: HTTP_METHOD_GET,
    data: params,
  });
}

export function mock(mockData: any): { post: Post; get: Get } {
  function log(method: string, url: string, response: any) {
    console.log(`${method} ${url}`, response);
  }
  function getResponse(method: string, url: string, params: any) {
    return new FjsPromise<HttpResponse>((resolve, reject) => {
      const key = `${method} ${url}`;
      let data = mockData[key];
      if (typeof data === 'function') {
        data(params, {
          success: function (response: any, isHttpResponse: boolean = false) {
            let httpResponse = {
              status: 'success',
              resultObject: response,
            };
            if (isHttpResponse) {
              httpResponse = Object.assign({ status: 'success' }, response);
            }
            log(method, url, httpResponse);
            resolve(httpResponse);
          },
          error: function (error: any) {
            const httpResponse = new HttpResponseError('API_ERROR', 'api error', error);
            log(method, url, httpResponse);
            reject(httpResponse);
          },
        });
      } else {
        const httpResponse = {
          status: 'success',
          resultObject: data,
        };
        log(method, url, httpResponse);
        resolve(httpResponse);
      }
    });
  }
// todo post,get类型定义错误
  return {
    post: curryN(2, function (url: string, params: any) {
      return getResponse('POST', url, params);
    }),
    get: curryN(2, function (url: string, params: any) {
      return getResponse('GET', url, params);
    }),
  };
}

/**
 * 获取网络请求结果
 * @param defaultValue
 * @param httpResponse
 */
export function resultObject(defaultValue: any, httpResponse: HttpResponse) {
  return prop(defaultValue, [null, undefined], 'resultObject', httpResponse);
}

export interface ResultObject1 {
  (defaultValue: any): (httpResponse: HttpResponse) => any;
}

export interface ResultObject2 {
  (defaultValue: any, httpResponse: HttpResponse): any;
}

export type ResultObject = ResultObject1 & ResultObject2;