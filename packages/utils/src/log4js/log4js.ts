import getGlobalVars from '../global';


export interface Log4JsOptions {
    /**
     * 用于错误跟踪 
     */
    traceid?: string,

    /**
     * 请求参数
     */
    param?: any,

    /**
     * 请求接口
     */
    requestPath?: string,

    /**
     * 信息
     */
    message?: string,

    /**
     * 错误信息
     */
    errMessage?: string
}

export interface Log4Js {
    /**
     * @param options 
     */
    error(options:Log4JsOptions):void ; 
}

class Log4JsImpl {
    error(options:Log4JsOptions):void {
        this.send('ERROR', options);
    }

    private send(logLevel:string, options:Log4JsOptions) { 
        switch (logLevel) {
            case 'ERROR':
                break
            // case 'INFO':
            //     break
            // case 'WARN':
            //     break
            // case 'DEBUG':
            //     return
            default:
                return
        }

        var requestData = {
            'ip': '',
            'traceid': options.traceid || uuid(),
            'param': options.param || document.location.search,
            'requestTime': dateFormat("yyyy-MM-dd HH:mm:ss.S", new Date()),
            'requestPath': options.requestPath || document.location.href,
            'logLevel': logLevel,
            'deviceType': getDeviceType(),
            'env': getGlobalVars().gatewayEnvPrefix,
            'version': getGlobalVars().version,
            'module': getGlobalVars().sysCode,
            'message': options.message,
            'errMessage': options.errMessage
        };
        this.sendHttp(requestData);
    }

    private sendHttp(data:any) {
        var xhr = new XMLHttpRequest();
        // xhr.open("POST", '/rs/sys/log/save.do', true);
        // 用于保存日志
        // todo 路径待填写
        xhr.open("POST", '', true);
        xhr.onreadystatechange = function () {
            //Call a function when the state changes.
            if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
            } else {
                //todo retry
            }
        };
        var formData = new FormData();
        formData.append('logInfo', JSON.stringify([data]));
        xhr.send(formData);
    }
}

export default new Log4JsImpl() as Log4Js;


function dateFormat(fmt:string, date:Date): string {
    var o:any = {
        "M+": date.getMonth() + 1, //月份 
        "d+": date.getDate(), //日 
        "H+": date.getHours(), //小时 
        "m+": date.getMinutes(), //分 
        "s+": date.getSeconds(), //秒 
        "q+": Math.floor((date.getMonth() + 3) / 3), //季度 
        "S": date.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

export function uuid():string {
    var s:any = [];
    var accountId = getGlobalVars().accountId;
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";
    var uuid = s.join("");
    return accountId + "-" + uuid + "-" + new Date().getTime();
}


function getDeviceType() {
    var ua = navigator.userAgent, tem,
        M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if (/trident/i.test(M[1])) {
        tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
        return 'IE ' + (tem[1] || '');
    }
    if (M[1] === 'Chrome') {
        tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
        if (tem != null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
    }
    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
    if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
    return M.join(' ');
}