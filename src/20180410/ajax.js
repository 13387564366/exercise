const http = {
  /**
   * js封装ajax请求,使用 XMLHttpRequest.onreadystatechange方法注册回调
   */
  ajax: (settings = {}) => {
    // 初始化请求参数
    let _s = Object.assign({
      url: '', // string
      type: 'GET', // string 'GET' 'POST' 'DELETE'
      dataType: 'json', // string 期望的返回数据类型:'json' 'text' 'document' ...
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
        // 注意:状态码200表示请求发送/接受成功,不表示业务处理成功
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
      _s.url = http.getQueryUrl(_s.url, _s.data);
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
    // 发送请求.如果是简单请求,请求参数应为null.否则,请求参数类型需要和请求头Content-Type对应
    xhr.send(useUrlParam ? null : http.getQueryData(_s.data));
  },
  // 把data参数拼装在url上
  getQueryUrl: (url, data) => {
    if (!data) {
      return url;
    }
    let paramsStr = data instanceof Object ? http.getQueryString(data) : data;
    if (paramsStr) {
      url += (url.indexOf('?') !== -1) ? paramsStr : '?' + paramsStr
    }
    return url;
  },
  // 获取ajax请求参数
  getQueryData: (data) => {
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
  getQueryString: (data) => {
    let paramsArr = [];
    if (data instanceof Object) {
      for (const key in data) {
        let val = data[key];
        // todo 参数Date类型需要根据后台api酌情处理
        if (val instanceof Date) {
          // val = dateFormat(val, 'yyyy-MM-dd hh:mm:ss')
        }
        paramsArr.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
      }
    }
    return paramsArr.join('&');
  }
};
