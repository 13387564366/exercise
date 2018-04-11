'use strict';

var http = {
  /**
   * js封装ajax请求
   * >>使用new XMLHttpRequest 创建请求对象,所以不考虑低端IE浏览器(IE6及以下不支持XMLHttpRequest)
   * >>使用es6语法,如果需要在浏览器环境使用,则需要用babel转换
   *
   * @param settings 请求参数,其中data需要和请求头Content-Type对应
   *  Content-Type                        data                                     描述
   *  application/x-www-form-urlencoded   'name=哈哈&age=12'或{name:'哈哈',age:12}  查询字符串,用&分割
   *  application/json                     name=哈哈&age=12'                        json字符串
   *  multipart/form-data                  new FormData()                           FormData对象,当为FormData类型,不要手动设置Content-Type
   *  注意:请求参数如果包含日期类型.是否能请求成功需要后台接口配合
   */
  ajax: function ajax() {
    var settings = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    // 初始化请求参数
    var _s = Object.assign({
      url: '', // string
      type: 'GET', // string 'GET' 'POST' 'DELETE'
      dataType: 'json', // string 期望的返回数据类型:'json' 'text' 'document' 'blob' 'arraybuffer'
      async: true, //  boolean true:异步请求 false:同步请求 required
      data: null, // any 请求参数,data需要和请求头Content-Type对应
      headers: {}, // object 请求头
      timeout: 0, // string 超时时间:0表示不设置超时
      beforeSend: function beforeSend(xhr) {},
      success: function success(result, status, xhr) {},
      error: function error(xhr, status, _error) {},
      complete: function complete(xhr, status) {}
    }, settings);
    // 参数验证
    if (!_s.url || !_s.type || !_s.dataType || !_s.async) {
      alert('参数有误');
      return;
    }
    // 创建XMLHttpRequest请求对象
    var xhr = new XMLHttpRequest(),
        timeoutTimer = void 0,
        timedOut = false;
    // 请求回调函数
    xhr.onreadystatechange = function () {
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
      var status = xhr.status;
      if (status >= 200 && status < 300 || status === 304) {
        var result = void 0;
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
    var useUrlParam = false,
        sType = _s.type.toUpperCase();
    if (sType === 'GET' || sType === 'DELETE') {
      useUrlParam = true;
      _s.url = http.getQueryUrl(_s.url, _s.data);
    }
    //调用请求前回调函数
    _s.beforeSend(xhr);
    // 初始化请求
    xhr.open(_s.type, _s.url, _s.async);
    // 设置期望的返回数据类型
    xhr.responseType = _s.dataType;
    // 设置请求头
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = Object.keys(_s.headers)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var key = _step.value;

        xhr.setRequestHeader(key, _s.headers[key]);
      }
      // 监测超时
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    if (_s.async && _s.timeout) {
      timeoutTimer = window.setTimeout(function () {
        timedOut = true;
        xhr.abort();
      }, _s.timeout);
    }
    // 发送请求.如果是简单请求,请求提应为null.否则,请求体类型需要和请求头Content-Type对应
    xhr.send(useUrlParam ? null : http.getQueryData(_s.data));
  },
  // 把data参数拼装在url上
  getQueryUrl: function getQueryUrl(url, data) {
    if (!data) {
      return url;
    }
    var paramsStr = data instanceof Object ? http.getQueryString(data) : data;
    if (paramsStr) {
      url += url.indexOf('?') !== -1 ? paramsStr : '?' + paramsStr;
    }
    return url;
  },
  // 获取ajax请求参数
  getQueryData: function getQueryData(data) {
    if (!data) {
      return null;
    }
    if (typeof data === 'string') {
      return data;
    }
    if (data instanceof FormData) {
      return data;
    }
    return http.getQueryString(data);
  },
  // 把对象转为查询字符串
  getQueryString: function getQueryString(data) {
    var paramsArr = [];
    if (data instanceof Object) {
      for (var key in data) {
        var val = data[key];
        // todo Date类型需要根据后台api酌情处理
        if (val instanceof Date) {
          val = dateFormat(val, 'yyyy-MM-dd hh:mm:ss');
        }
        paramsArr.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
      }
    }
    return paramsArr.join('&');
  },
  // 添加权限请求头
  addAuthorizationHeader: function addAuthorizationHeader(settings) {
    settings.headers = settings.headers || {};
    var headerKey = 'Authorization';
    // 判断是否已经存在权限header
    var hasAuthorization = Object.keys(settings.headers).some(function (key) {
      return key === headerKey;
    });
    if (!hasAuthorization) {
      settings.headers[headerKey] = ''; // todo 从缓存中获取权限头
    }
  },
  /**
   * 根据实际业务情况装饰 ajax 方法
   * 如:统一异常处理,添加http请求头,请求展示loading等
   * @param settings
   */
  request: function request() {
    var settings = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    // 统一异常处理函数
    var errorHandle = function errorHandle(xhr, status) {
      console.log('request error...');
      if (status === 401) {
        console.log('request 没有权限...');
      }
    };
    // 使用before拦截参数的 beforeSend 回调函数
    settings.beforeSend = (settings.beforeSend || function () {}).before(function (xhr) {
      console.log('request show loading...');
    });
    // 拦截参数的 success
    settings.success = (settings.success || function () {}).before(function (result, status, xhr) {
      console.log('request success...');
      // todo 根据后台api判断是否请求成功
      if (result && result instanceof Object && result.code !== 1) {
        errorHandle(xhr, status);
      }
    });
    // 拦截参数的 error
    settings.error = (settings.error || function () {}).before(function (result, status, xhr) {
      errorHandle(xhr, status);
    });
    // 拦截参数的 complete
    settings.complete = (settings.complete || function () {}).after(function (xhr, status) {
      console.log('request hide loading...');
    });
    // 请求添加权限头
    http.ajax.before(http.addAuthorizationHeader)(settings);
  },
  get: function get(url, data, successCallback) {
    var dataType = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'json';

    http.request({
      url: url,
      type: 'GET',
      dataType: dataType,
      data: data,
      success: function success(result, status, xhr) {
        successCallback && successCallback(result, status, xhr);
      }
    });
  },
  delete: function _delete(url, data, successCallback) {
    var dataType = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'json';

    http.request({
      url: url,
      type: 'DELETE',
      dataType: dataType,
      data: data,
      success: function success(result, status, xhr) {
        successCallback && successCallback(result, status, xhr);
      }
    });
  },
  // 调用此方法,参数data应为查询字符串或普通对象
  post: function post(url, data, successCallback) {
    var dataType = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'json';

    http.request({
      url: url,
      type: 'POST',
      dataType: dataType,
      data: data,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      success: function success(result, status, xhr) {
        successCallback && successCallback(result, status, xhr);
      }
    });
  },
  // 调用此方法,参数data应为json字符串
  postBody: function postBody(url, data, successCallback) {
    var dataType = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'json';

    http.request({
      url: url,
      type: 'POST',
      dataType: dataType,
      data: data,
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      success: function success(result, status, xhr) {
        successCallback && successCallback(result, status, xhr);
      }
    });
  }

};

Function.prototype.before = function (beforeFn) {
  var _self = this;
  return function () {
    beforeFn.apply(this, arguments);
    _self.apply(this, arguments);
  };
};
Function.prototype.after = function (afterFn) {
  var _self = this;
  return function () {
    _self.apply(this, arguments);
    afterFn.apply(this, arguments);
  };
};

// 日期格式化
var dateFormat = function dateFormat(date) {
  var sFormat = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'yyyy-MM-dd';

  if (!date instanceof Date) {
    return;
  }
  var time = {
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

  return sFormat.replace(/yyyy/ig, String(time.Year)).replace(/yyy/ig, String(time.Year)).replace(/yy/ig, time.TYear).replace(/y/ig, time.TYear).replace(/MM/g, time.TMonth).replace(/M/g, String(time.Month)).replace(/dd/ig, time.TDay).replace(/d/ig, String(time.Day)).replace(/HH/g, time.THour).replace(/H/g, String(time.Hour)).replace(/hh/g, time.Thour).replace(/h/g, String(time.hour)).replace(/mm/g, time.TMinute).replace(/m/g, String(time.Minute)).replace(/ss/ig, time.TSecond).replace(/s/ig, String(time.Second)).replace(/fff/ig, String(time.Millisecond));
};