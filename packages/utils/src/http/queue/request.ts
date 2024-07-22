
import FjsPromise from '../../commons/promise';
import Axios, { AxiosRequestConfig,InternalAxiosRequestConfig } from 'axios';
import { curry, compose, replace } from 'ramda';
import { HttpEventManager } from '../manager/index';
import { Log4Js, uuid } from '../../log4js';
import * as qs from 'qs';
import { getMockFrontSec, getService } from '../consul/consul';

const NETWORK_ERROR_MESSAGE = '网络请求错误，请检查你的网络或稍后刷新重试';
const NETWORK_ERROR = 'UNKNOW_ERROR';

const SERVER_ERROR = 'SERVER_ERROR';
const SERVER_ERROR_MESSAGE = '服务器处理异常，请稍后重试';

const CONTENT_TYPE = {
  X_WWW_FORM_URLENCODED: 'application/x-www-form-urlencoded;charset=UTF-8',
};

export interface HttpRequestOptions {
  url: string;
  method: 'POST' | 'GET';
  data?: any;
  headers?: any;
  timeout?: number;
  urlSuffix?: string;
  responseType?: string;
}

export class HttpResponseError {
  type: string;
  message: any;
  error: {} | undefined;

  constructor(type: string, message: string, error?: any) {
    this.type = type;
    this.message = message;
    if (error) {
      this.error = error;
    }
  }

  toString() {
    return this.message;
  }
}

const defaultOptions = {
  urlSuffix: '.do',
  timeout: 60 * 1000,
  responseType: 'json',
};

export async function request<T>(options: HttpRequestOptions): Promise<FjsPromise<T>> {
  try {
    // 非dumi文档环境中使用会出现DevAccessOrigin is not defined，进行try catch防止页面报错
    // todo 这里的DevAccessOrigin不知道哪里来的，先定义下，否则会报undefined
    let DevAccessOrigin = '';
    if (DevAccessOrigin == 'consul') {
      // 在组件库文档中使用请求的情况下，我们需要连接Consul做服务发现直接找到对应的服务 跳过登录权限的认证的操作访问对应的接口。
      let { url: path } = options;
      const servOptions = {
        cacheId: 'doc-cache-id',
        env: 'default',
      };
      const service: any = await getService(servOptions, path);
      console.log(`Path:${path} Host:${service.host} Port:${service.port}`);
      path = path.replace(/(^\/rs|.do$)/g, '');
      // options.url = `http://${service.host}:${service.port}${path}`;
      options.url = `${location.protocol}//${service.host}:${service.port}${path}`;
      options.urlSuffix = '';
      options.headers = { 'Front-Sec': getMockFrontSec(), ...options.headers };
    }
  } catch (err) {}
  return new FjsPromise<T>((resolve, reject) => {
    options = Object.assign({}, defaultOptions, options);
    // todo 这里为什么报错
    const config: any = compose(
      data(options),
      headers(options),
      url(options),
      createAxiosConfig
    )(options);
    Axios.create()
      .request(config)
      .then((response) => {
        if (isOk(response.status)) {
          //http全局事件
          handleHttpEvent(response);
          //发送错误报告日志
          if (response.data && response.data.status != 'success') {
            if (response.data.exceptionLevel == 'ERROR') {
              Log4Js.error({
                traceid: config.headers['Traceid'],
                requestPath: config.url,
                param: config.data,
                message: response.data.message,
                errMessage: response.data.exceptionMessage,
              });
            }
          }
          resolve(
            Object.assign({}, response.data, {
              httpStatus: response.status,
              httpStatusText: response.statusText,
            })
          );
        } else {
          //发送错误报告日志
          Log4Js.error({
            traceid: config.headers['Traceid'],
            requestPath: config.url,
            param: config.data,
            message: SERVER_ERROR_MESSAGE + ' : ' + response.statusText,
            errMessage: response.data,
          });
          reject(new HttpResponseError(SERVER_ERROR, SERVER_ERROR_MESSAGE, response));
        }
      })
      .catch((err) => {
        //发送错误报告日志
        Log4Js.error({
          traceid: config.headers['Traceid'],
          requestPath: config.url,
          param: config.data,
          message: NETWORK_ERROR_MESSAGE,
          errMessage: err.message,
        });
        reject(new HttpResponseError(NETWORK_ERROR, NETWORK_ERROR_MESSAGE, err));
      });
  });
}

function handleHttpEvent(response: any = {}): void {
  const data = response.data || {};
  if (data.status == HttpEventManager.LOGIN_TIMEOUT) {
    HttpEventManager.emit(HttpEventManager.LOGIN_TIMEOUT, data);
  }
  if (data.status == HttpEventManager.ERROR_VERSION) {
    HttpEventManager.emit(HttpEventManager.ERROR_VERSION, data);
  }
}

function isOk(status: number): boolean {
  return status >= 200 && status < 300;
}

var data = curry(function (
  options: HttpRequestOptions,
  axiosOptions: InternalAxiosRequestConfig
): AxiosRequestConfig {
  options;
  if (axiosOptions.headers['Content-Type'] == CONTENT_TYPE.X_WWW_FORM_URLENCODED) {
    if (options.method === 'GET') {
      if (axiosOptions.params) {
        axiosOptions.paramsSerializer = function (params) {
          return qs.stringify(params, { arrayFormat: 'brackets' });
        };
      }
    } else {
      if (axiosOptions.data) {
        return Object.assign({}, axiosOptions, {
          data: qs.stringify(axiosOptions.data || {}),
        });
      }
    }
  }
  return axiosOptions;
});

var url = curry(function (
  options: HttpRequestOptions,
  axiosOptions: AxiosRequestConfig
): AxiosRequestConfig {
  /**mock钩子，解决请求路径问题 */
  if ((window as any).__mockPath__) {
    options.url = `${(window as any).__mockPath__}${options.url}`;
  }
  if (options.urlSuffix) {
    return Object.assign({}, axiosOptions, {
      url: `${options.url}${options.urlSuffix}`,
    });
  }
  return Object.assign({}, axiosOptions, {
    url: `${options.url}`,
  });
});

var headers = curry(function (
  options: HttpRequestOptions,
  axiosOptions: AxiosRequestConfig
): AxiosRequestConfig {
  const headers = {
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': CONTENT_TYPE.X_WWW_FORM_URLENCODED,
    Traceid: uuid(),
  };
  if (options.headers) {
    Object.assign(headers, options.headers);
  }
  return Object.assign({}, axiosOptions, {
    headers: headers,
  });
});

function createAxiosConfig(options: HttpRequestOptions): AxiosRequestConfig {
  const config: any = {
    method: (options.method || 'GET').toUpperCase(),
    timeout: typeof options.timeout == 'undefined' ? 60 * 1000 : options.timeout,
    responseType: options.responseType ? options.responseType : 'json',
  };
  if (config.method == 'GET') {
    Object.assign(config, {
      params: excludeNullOrUndefined(options.data || {}),
    });
  } else {
    Object.assign(config, {
      data: excludeNullOrUndefined(options.data || {}),
    });
  }
  return config;
}

function excludeNullOrUndefined(params: any) {
  const targetParams: any = {};
  Object.keys(params).forEach((key) => {
    if (!(params[key] === null || params[key] === undefined)) {
      targetParams[key] = params[key];
      // targetParams[key] =
      //   typeof params[key] == 'string' ? replace(/\+/g, '%2B', params[key]) : params[key];
    }
  });
  return targetParams;
}
