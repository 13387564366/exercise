/**
 * request方法根据实际业务请求包装ajax方法
 * 如:统一异常处理,添加http请求头,请求展示loading等
 * @param settings
 */
request = (settings = {}) => {
    // todo 根据api接口情况添加权限请求头
    settings.headers = settings.headers || {};
    const autoHeader = 'Authorization';
    let hasAuthorization = Object.keys(settings.headers).some(key => {
        return key === autoHeader;
    });
    if (!hasAuthorization) {
        settings.headers[autoHeader] = ''; // todo 从缓存中获取权限头
    }
    let beforeSendFn = settings.beforeSend || (() => {
    });
    let successFn = settings.success || (() => {
    });
    let errorFn = settings.error || (() => {
    });
    let completeFn = settings.complete || (() => {
    });
    settings.beforeSend = function (xhr) {
        console.log('request show loading...');
        beforeSendFn(xhr);
    };
    settings.success = (result, status, xhr) => {
        console.log('request success...');
        // todo 根据后台api判断是否请求成功
        if (result && result instanceof Object && result.code !== 1) {
            errorFn(xhr, status);
            return;
        }
        successFn(result, status, xhr);
    };
    settings.error = (result, status, xhr) => {
        console.log('request error...');
        errorFn(xhr, status);
    };
    settings.complete = function (xhr, status) {
        console.log('request hide loading...');
        completeFn(xhr, status);
    };
    ajax(settings);
};

/**
 * js封装ajax请求
 * >>使用es6语法,使用new XMLHttpRequest创建请求对象,所以不考虑低端ie浏览器
 *
 * @param settings 请求参数,其中data需要和请求头Content-Type对应
 *  Content-Type                        data                                     描述
 *  application/x-www-form-urlencoded   'name=哈哈&age=12'或{name:'哈哈',age:12}  查询字符串,用&分割
 *  application/json                     name=哈哈&age=12'                        json字符串
 *  multipart/form-data                  new FormData()                           FormData对象,当为FormData类型,不要手动设置Content-Type
 *  注意:请求参数如果包含日期类型.是否能请求成功需要后台接口配合
 */
ajax = (settings = {}) => {
    // 初始化请求参数
    let _s = Object.assign({
        url: '', // string
        type: 'GET', // string 'GET' 'POST' 'DELETE'
        dataType: 'json', // string 期望的返回数据类型:'json' 'text' 'document' 'blob' 'arraybuffer'
        async: true, //  boolean true:异步请求 false:同步请求 required
        data: null, // any 请求参数,data需要和请求头Content-Type对应
        headers: {}, // object 请求头
        timeout: 0, // string 超时时间:0表示不设置超时
        beforeSend: (xhr) => {
        },
        success: (result, status, xhr) => {
        },
        error: (xhr, status, error) => {
        },
        complete: (xhr, status) => {
        }
    }, settings);
    // 参数验证
    if (!_s.url || !_s.type || !_s.dataType || !_s.async) {
        alert('参数有误');
        return;
    }
    // 创建XMLHttpRequest请求对象
    let xhr = new XMLHttpRequest(), timeoutTimer, timedOut = false;
    // 请求回调函数
    xhr.onreadystatechange = () => {
        if (xhr.readyState !== 4) {
            return;
        }
        if (timeoutTimer) {
            window.clearTimeout(timeoutTimer);
        }
        // 超时处理,超时状态码:408
        if (timedOut) {
            _s.error(xhr, 408, new Error('timeout'));
            _s.complete(xhr, 408);
            timedOut = false;
            return;
        }
        const status = xhr.status;
        if ((status >= 200 && status < 300) || status === 304) {
            let result;
            if (xhr.responseType === 'text') {
                result = xhr.responseText;
            } else if (xhr.responseType === 'document') {
                result = xhr.responseXML;
            } else {
                result = xhr.response;
            }
            // todo 这里可能不应该直接调用success,状态码成功只表示请求成功
            // todo 不表示业务处理成功.所以可能还需要根据实际的api接口返回数据进行判断是否调用success还是error
            _s.success(result, status, xhr);
        } else {
            _s.error(xhr, status);
        }
        _s.complete(xhr, status);
    };

    // 如果是"简单"请求,则把data参数组装在url上
    let useUrlParam = false, sType = _s.type.toUpperCase();
    if (sType === 'GET' || sType === 'DELETE') {
        useUrlParam = true;
        _s.url = getQueryUrl(_s.url, _s.data);
    }
    //调用请求前回调函数
    _s.beforeSend(xhr);
    // 初始化请求
    xhr.open(_s.type, _s.url, _s.async);
    // 设置期望的返回数据类型
    xhr.responseType = _s.dataType;
    // 设置请求头
    for (const key of Object.keys(_s.headers)) {
        xhr.setRequestHeader(key, _s.headers[key]);
    }
    // 监测超时
    if (_s.async && _s.timeout) {
        timeoutTimer = window.setTimeout(() => {
            timedOut = true;
            xhr.abort();
        }, _s.timeout);
    }
    // 发送请求.如果是简单请求,请求提应为null.否则,请求体类型需要和请求头Content-Type对应
    xhr.send(useUrlParam ? null : getQueryString(_s.data));
};


let getQueryUrl = (url, data) => {
    if (!data) {
        return url;
    }
    let paramsStr = getQueryString(data);
    if (paramsStr) {
        url += (url.indexOf('?') !== -1) ? paramsStr : '?' + paramsStr
    }
    return url;
};

let getQueryString = (data) => {
    if (!data) {
        return null;
    }
    if (typeof data === 'string') {
        return data;
    }
    if (data instanceof FormData) {
        return data;
    }
    let paramsArr = [];
    if (data instanceof Object) {
        for (const key in data) {
            let val = data[key];
            if (val instanceof Date) {
                val = dateFormat(val, 'yyyy-MM-dd hh:mm:ss')
            }
            paramsArr.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
        }
    }
    return paramsArr.join('&');
};

let dateFormat = (date, sFormat = 'yyyy-MM-dd') => {
    if (!date instanceof Date) {
        return;
    }
    let time = {
        Year: 0,
        TYear: '0',
        Month: 0,
        TMonth: '0',
        Day: 0,
        TDay: '0',
        Hour: 0,
        THour: '0',
        hour: 0,
        Thour: '0',
        Minute: 0,
        TMinute: '0',
        Second: 0,
        TSecond: '0',
        Millisecond: 0
    };
    time.Year = date.getFullYear();
    time.TYear = String(time.Year).substr(2);
    time.Month = date.getMonth() + 1;
    time.TMonth = time.Month < 10 ? "0" + time.Month : String(time.Month);
    time.Day = date.getDate();
    time.TDay = time.Day < 10 ? "0" + time.Day : String(time.Day);
    time.Hour = date.getHours();
    time.THour = time.Hour < 10 ? "0" + time.Hour : String(time.Hour);
    time.hour = time.Hour < 13 ? time.Hour : time.Hour - 12;
    time.Thour = time.hour < 10 ? "0" + time.hour : String(time.hour);
    time.Minute = date.getMinutes();
    time.TMinute = time.Minute < 10 ? "0" + time.Minute : String(time.Minute);
    time.Second = date.getSeconds();
    time.TSecond = time.Second < 10 ? "0" + time.Second : String(time.Second);
    time.Millisecond = date.getMilliseconds();

    return sFormat.replace(/yyyy/ig, String(time.Year))
        .replace(/yyy/ig, String(time.Year))
        .replace(/yy/ig, time.TYear)
        .replace(/y/ig, time.TYear)
        .replace(/MM/g, time.TMonth)
        .replace(/M/g, String(time.Month))
        .replace(/dd/ig, time.TDay)
        .replace(/d/ig, String(time.Day))
        .replace(/HH/g, time.THour)
        .replace(/H/g, String(time.Hour))
        .replace(/hh/g, time.Thour)
        .replace(/h/g, String(time.hour))
        .replace(/mm/g, time.TMinute)
        .replace(/m/g, String(time.Minute))
        .replace(/ss/ig, time.TSecond)
        .replace(/s/ig, String(time.Second))
        .replace(/fff/ig, String(time.Millisecond))
};


Function.prototype.before = function (fn) {
    let originalFn = this;
    return function () {
        fn.apply(this, arguments);
        originalFn.apply(this, arguments);
    }
};
Function.prototype.after = function (fn) {
    let originalFn = this;
    return function () {
        originalFn.apply(this, arguments);
        fn.apply(this, arguments);
    }
};
