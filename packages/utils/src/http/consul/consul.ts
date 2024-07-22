// 内容借鉴自omt-api 如有有问题可追溯这个项目进行查看https://git.dianplus.cn/frontend/omt-api.git
import Axios from 'axios';
import kvStore from './kv-store';
import { Base64 } from 'js-base64';

/**
 * 通过consul获取服务器地址
 * @param options 缓存id和环境
 * @param path 请求访问路径
 * @returns
 */
export function getService(options: { cacheId: string; env: any }, path: string) {
  return new Promise((resolve, reject) => {
    getModule(getBizName(path), options.cacheId)
      .then((module: any) => {
        Promise.all([
          getRoutes('default', options.cacheId),
          getRoutes(options.env || 'default', options.cacheId),
        ])
          .then((routes) => {
            const routesConfig: any = {};
            routes.forEach((r) => {
              Object.assign(routesConfig, r);
            });
            const tag = routesConfig[module] || 'test';
            getAddress(module, tag, options.cacheId).then(resolve).catch(reject);
          })
          .catch(reject);
      })
      .catch(reject);
  });
}

function getAddress(module: string, tag: string, cacheIdPrefix: string) {
  const cacheId = `${cacheIdPrefix}-${module}-${tag}`;
  return new Promise((resolve, reject) => {
    const cachedAddress = kvStore.get(cacheId);
    if (cachedAddress) {
      return resolve(cachedAddress);
    }
    httpGet(`/consulApi/catalog/service/${module}?tag=${tag}`)
      .then((response) => {
        if (response && Array.isArray(response) && response.length > 0) {
          const address = {
            host: response[0].ServiceAddress,
            port: response[0].ServicePort,
          };
          kvStore.set(cacheId, address);
          resolve(address);
        }
        reject(new Error(`Get target address failed, module=${module}, tag=${tag}`));
      })
      .catch(reject);
  });
}

function getRoutes(name: string, cacheIdPrefix: string) {
  const cacheId = `${cacheIdPrefix}-${name}`;
  return new Promise((resolve, reject) => {
    const cachedRoutes = kvStore.get(cacheId);
    if (cachedRoutes) {
      return resolve(cachedRoutes);
    }
    return httpGet(`/consulApi/kv/ROUTE_TABLE/${name}`)
      .then((response) => {
        if (response && Array.isArray(response) && response.length > 0) {
          try {
            const routes = JSON.parse(response[0].Value ? Base64.decode(response[0].Value) : '{}');
            kvStore.set(cacheId, routes);
            return resolve(routes);
          } catch (err) {
            return reject(err);
          }
        }
        reject(new Error(`Get route table failed, name=${name}`));
      })
      .catch(reject);
  });
}

function getModule(bizName: string, cacheIdPrefix: string) {
  const cacheId = `${cacheIdPrefix}-${bizName}`;
  return new Promise((resolve, reject) => {
    const cachedModule = kvStore.get(cacheId);
    if (cachedModule) {
      return resolve(cachedModule);
    }
    httpGet(`/consulApi/kv/SERVICE_ROUTE_TABLE/${bizName}/?recurse`)
      .then((response) => {
        if (response && Array.isArray(response) && response.length > 0) {
          let targetModule = '',
            timestamp = 0;
          response.forEach((item) => {
            const itemTimeStamp = parseFloat(Base64.decode(item.Value) || '1');
            if (itemTimeStamp > timestamp) {
              timestamp = itemTimeStamp;
              targetModule = item.Key;
            }
          });
          const moduleComponents = targetModule.split('/');
          if (moduleComponents.length > 0) {
            const module = moduleComponents[moduleComponents.length - 1];
            kvStore.set(cacheId, module);
            return resolve(module);
          }
        }
        reject(new Error(`Can not find ${bizName} on consul`));
      })
      .catch(reject);
  });
}

function httpGet(url: string) {
  return Axios.get(url).then((response) => {
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    }
    throw new Error(`Http request failed, status code = ${response.statusText}`);
  });
}

function getBizName(path: string) {
  const name = (path || '').split('/')[2] || '';
  return `biz-${name}`;
}

/**
 * 获取文档请求的时候的模拟用户信息
 */
export function getMockFrontSec() {
  const FrontSecKeys = [
    'brandId',
    'depId',
    'accountId',
    'staffId',
    'roleId',
    'storageId',
    'channelId',
  ];
  const userInfo: any = {
    entId: '10029',
    displayName: '红人_029',
    roleId: '4',
    brandEnabled: 'true',
    deptId: '334779534781997056',
    rootChannelPath: 'R/10029',
    staffType: '1',
    accountId: '114067',
    areaId: '337285399112065025',
    authority: '509358771290517504',
    brandId: '10029',
    channelName: '总部渠道',
    channelPath: 'R/10029',
    staffId: '100414',
    channelId: '10029',
    storageId: '501490720557764608',
  };

  const frontSec = FrontSecKeys.reduce((total, next) => {
    return {
      ...total,
      [next]: userInfo[next],
    };
  }, {});
  return JSON.stringify(frontSec);
}
