// 这个Promise保证统一入口(只在一个文件中引用), 其他调用统一通过该文件的exports调用
// 如果es6-promise可用, 就不要用bluebird了, 减小体积
// let Promise = require('./utils/bluebird.min');

// 如果手机端对es6支持较好, 这polyfill可以不引入
// let polyfill = require('./utils/babel-polyfill.6.26.0.min');
let Promise = require('./es6-promise.min');
let config = require('../config');

let emptyArr = [],
  emptyObj = {},
  noop = function() {};

let core_slice = emptyArr.slice,
  toString = emptyObj.toString,
  hasOwn = emptyObj.hasOwnProperty;

// let app = getApp();, 这样获取不到...

/**
 * 运行一个函数
 * @param {function} fn 函数名 
 * @param {*} context 函数的this值
 */
function runFn(fn, context) {
  return typeof fn === 'function' ? fn.apply(context, core_slice.call(arguments, 2)) : fn;
}

/**
 * 抛出错误
 */
function throwError(msg) {
  throw new Error(msg);
}

/**
 * 类型判断
 * @param {*} input 
 */
function type(input) {
  let typeMatch = toString.call(input).match(/^\[object\s*(\w+)\]$/);
  return typeMatch ? typeMatch[1].toLowerCase() : 'null';
}

/**
 * 去除字符串左右空白
 * @param {*} str 
 */
function trim(str) {
  return typeof str === 'string' ? str.replace(/^\s+|\s+$/, '') : str;
}

/**
 * 判断是否为纯对象
 * @param {*} obj 
 */
function isPlainObject(obj) {
  if (type(obj) !== "object" /* || obj.nodeType || obj.window === obj */ ) {
    return false;
  }

  if (obj.constructor &&
    !hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
    return false;
  }

  return true;
}

/**
 * 判断是不是undefined
 * @param {*} input 
 */
function isUndef(input) {
  return typeof input === 'undefined';
}

/**
 * 判断是不是函数
 * @param {*} input 
 */
function isFunction(input) {
  return type(input) === 'function';
}

/**
 * 判断空否为对象 
 * @param {*} input 
 */
function isEmptyObject(input) {
  if (type(input) === 'object' && input) {
    for (let p in input) {
      return false;
    }
    return true;
  }
  return false;
}

/**
 * 判断是不是数组
 * @param {*} input 
 */
function isArray(input) {
  return Array.isArray ? Array.isArray(input) : type(input) === 'array';
}

/**
 * like jQuery extend
 */
function extend() {
  var options, name, src, copy, copyIsArray, clone,
    target = arguments[0] || {},
    i = 1,
    length = arguments.length,
    deep = false;

  // Handle a deep copy situation
  if (typeof target === "boolean") {
    deep = target;

    // Skip the boolean and the target
    target = arguments[i] || {};
    i++;
  }

  // Handle case when target is a string or something (possible in deep copy)
  if (typeof target !== "object" && type(target) !== 'function') {
    target = {};
  }

  // Extend jQuery itself if only one argument is passed
  if (i === length) {
    target = this;
    i--;
  }

  for (; i < length; i++) {
    // Only deal with non-null/undefined values
    if ((options = arguments[i]) != null) {
      // Extend the base object
      for (name in options) {
        src = target[name];
        copy = options[name];

        // Prevent never-ending loop
        if (target === copy) {
          continue;
        }

        // Recurse if we're merging plain objects or arrays
        if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
          if (copyIsArray) {
            copyIsArray = false;
            clone = src && isArray(src) ? src : [];

          } else {
            clone = src && isPlainObject(src) ? src : {};
          }

          // Never move original objects, clone them
          target[name] = extend(deep, clone, copy);

          // Don't bring in undefined values
        } else if (copy !== undefined) {
          target[name] = copy;
        }
      }
    }
  }

  // Return the modified object
  return target;
}

/**
 * 取字符串长度, 非字符串返回0
 * @param {*} input 
 */
function len(input) {
  return type(input) === 'string' ? input.length : 0;
}

/**
 * 在控制台打印日志, 调试用
 * @param {*} msg 要打印的消息
 * @param {*} modal 是否为模态窗模式, 默认为false
 */
function log(msg, modal = false) {
  if (modal) {
    wx.showModal({
      content: msg
    });
  } else {
    console.log(msg);
  }
}


/**
 * 劫持打印日志的方法, 方便全局控制
 * @param {*} enableLog 
 */
function hijackLogMethods(enableLog = true) {
  let methods = 'log info warn error'.split(' ');
  for (let i = 0, len = methods.length; i < len; ++i) {
    let tmp = methods[i]; // log info...
    let _method = console[tmp]; // 原始方法拷贝

    // if (enableLog) {
    //   console[tmp] = function() {
    //     _method.apply(null, arguments);
    //   };
    // } else {
    //   // console[tmp] = noop;
    // }

    console[tmp] = function() {
      if (enableLog) {
        _method.apply(null, arguments);
      }
    }
  }
}

/**
 * 简单的表单验证
 * bindsubmit	EventHandle	携带 form 中的数据触发 submit 事件，event.detail = {value : {'name': 'value'} , formId: ''}
 * 使用方法
 * 
 * let val = input.value,
 *  rules = {
 *    minlength: 5,
 *    max: length: 10
 *  },
 * result = checkInput(val, )
 * 
 * @param {number|string|boolean} val2 在有第二个值时指定, 如校验两个密码是否相同
 */
function checkInput(val, rules, val2) {

  // undefined || null: 没有"规则", 认为合法
  if (rules == null) {
    return true;
  }

  let defaultRules = {
    // required: true,
    // min: 5, // 针对数字
    // max: 10,
    // minlength: 5, // 针对文本
    // maxlength: 10,
    // otherRule: function(val) { /* 自定义校验规则 */ return true; }
  };

  rules = extend(rules, defaultRules);

  let results = {},
    prop,
    tmpRule;

  for (prop in rules) {
    tmpRule = rules[prop];

    if (isFunction(tmpRule)) {

      // 函数的运行结果即为校验结果
      // 一般为return true;或者return false;
      results[prop] = !!runFn(tmpRule, null, val);
    } else if (tmpRule == null) {
      // null || undefined表示可选, 直接返回true
      results[prop] = true;
    }

    // 一些普通的规则
    else {
      switch (prop) {

        // 不低于最小值
        case 'min':
          results[prop] = +val >= tmpRule;
          break;

          //　不超过最大值
        case 'max':
          results[prop] = +val <= tmpRule;
          break;

          // 最小长度限制
        case 'minlength':
          results[prop] = len(val) >= tmpRule;
          break;

          // 最大长度限制
        case 'maxlength':
          results[prop] = len(val) <= tmpRule;
          break;

          // required
        case 'required':
          if (type(tmpRule) === 'boolean') {
            results[prop] = true;
          } else {
            results[prop] = len(val + '') > 0;
          }
          break;

          // 手机号
        case 'phone':
          results[prop] = /^1[34578]\d{9}$/.test(val);
          break;

          // 验证两个输入框的内容是否相同, 规则
          // equalTo: [val1, val2]
        case 'equalTo':
          results[prop] = val === val2;
          break;

          // range: [min, max], 用一个数组指定区间
          // case 'range':
          //   results[prop] = len(val) >= tmpRule[0] && len(val) <= tmpRule[0];
          //   break;

        default:
          break;
      }
    }
  }
  // results = {
  //   required: false,
  //   min: false, 
  //   max: true,
  //   minlength: false,
  //   maxlength: true,
  //   otherRule: true
  // };

  return results;
}

/**
 * 判断一个对象所有key对应的值是不是true
 * @param {*} obj 
 */
function isAllPropTrue(obj) {
  if (!obj) {
    return false;
  }

  for (let p in obj) {
    if (obj[p] !== true) {
      return false;
    }
  }

  return true;
}

/**
 * 校验多个输入框
 * @param {*} valRuleArr 
 */
function checkInputs(valRuleArr /*  = [[val, rules, val2]] */ ) {

  if (!isArray(valRuleArr)) {
    throwError('checkInputs, arg must be an array!');
  }

  for (let i = 0, len = valRuleArr.length; i < len; ++i) {
    let tmp = checkInput(array[i]);

    if (tmp === true || isAllPropTrue(tmp)) {
      return true;
    } else {

      // 到这里来, 说明, 校验结果不通过, 返回第一个校验失败的结果
      return tmp;
    }
  }
}

/**
 * 获取url中的参数值
 * @param {*} url 
 * @param {*} name
 * 
 * @usage  getUrlParam('xx.com?a=1', 'a') => 1
 */
function getUrlParam(url, name) {

  url = url || '';

  let index = url.indexOf('?'),
    search;

  // 找到search, 包含问号
  if (index >= 0) {
    search = url.substring(index);
  }

  if (!search) {
    return null;
  }

  // 开头为&或者行开头, 然后是name, 然后是任意个非&符号, 然后是&或者行结尾
  let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");

  // 取?之后的作匹配
  let r = search.substr(1).match(reg);

  // 如果有, 取分组2, 也就是key=value的value
  if (r != null) {
    return decodeURIComponent(r[2]);
  }
  return null;
}

/**
 * 为url添加参数
 * @param {*} url 
 * @param {*} key 
 * @param {*} value 
 * @param {*} duplicate 是否允许重复, 默认为false
 * @param {boolean} encode 是否采用encodeURIComponent编码
 */
function addParam2urlHelper(url, key, value, duplicate) {

  let encode = true;

  if (typeof value === 'undefined') {
    return url;
  }

  duplicate = !!duplicate;
  value = encode ? encodeURIComponent(value) : value;

  if (url.indexOf('?') > 0) {

    // 如果还没有这个参数
    if (!getUrlParam(url, key)) {
      url += `&${key}=${value}`;
    } else {
      // 如果已经有参数了, 但是如果允许重复
      if (duplicate) {
        url += `&${key}=${value}`;
      } else {
        // 修改这个值
        // url = url.replace()
        url = url.replace(new RegExp(key + '=([^&]+)'), key + '=' + value);
      }
    }

  } else {

    // 到这来, 说明还没参数
    url += `?${key}=${value}`;
  }

  return url;
}

/**
 * 给url附加参数
 * @param {*} url 地址 
 * @param {*} key 参数名(可为对象)
 * @param {*} value 参数值
 * @param {*} duplicate 
 */
function addParam2url(url, key, value, duplicate) {

  // addParam2url(url, {});, 对象形式
  if (typeof key === 'object') {
    duplicate = value;
    value = void 0;

    for (let p in key) {
      url = addParam2urlHelper(url, p, key[p], duplicate);
    }
  } else {
    url = addParam2urlHelper(url, key, value, duplicate);
  }

  return url;
}

/**
 * 解析url, 暂为解析出qs
 * @param {boolean} decode 是否用decodeURIComponent解码, 默认为true
 */
function parseUrl(url, decode = true) {
  let index = url.indexOf('?');
  let ret = {};

  // 无参数, 直接返回空对象
  if (index < 0) {
    return ret;
  }

  // 取?之后的部分
  let qs = url.substring(index + 1),

    // 按&符号拆分
    qsArr = qs.split('&'),
    tmp, key, val;

  if (decode) {
    for (let i = 0, len = qsArr.length; i < len; ++i) {

      // 按等号拆分, 左右分别为key和value
      tmp = qsArr[i].split('=');
      key = decodeURIComponent(tmp[0]);
      val = decodeURIComponent(tmp[1]);

      if (key) {
        ret[key] = val;
      }
    }
  } else {
    for (let i = 0, len = qsArr.length; i < len; ++i) {
      tmp = qsArr[i].split('=');
      key = tmp[0];
      val = tmp[1];

      if (key) {
        ret[key] = val;
      }
    }
  }

  return ret;
}

/**
 * 解析动态内容(可能包含话题链接和@人链接)
 * 这应该后台处理, 不然页面太复杂, TODO
 * @param {*} content 
 */
function _parseContent(content, options = {}) {

  // 全不解析
  if (options.noAll === true) {
    return content;
  }

  if (!content || typeof content !== 'string') {
    return '';
  }

  content = trim(content);

  // 分界符
  const LEFT_SEP = '[';
  const RIGHT_SEP = ']';
  const MIDDLE_SEP = ':';

  if (content.indexOf(LEFT_SEP) < 0 &&
    content.indexOf(RIGHT_SEP) < 0 &&
    content.indexOf(MIDDLE_SEP) < 0) {
    return [{
      isText: true,
      text: content
    }];
  }

  let reTopic = new RegExp(`\\${LEFT_SEP}#(\\d+)${MIDDLE_SEP}([^#]+)#\\${RIGHT_SEP}`, 'ig'); // /\[#(\d+):([^#]+)#\]/ig;
  let reAt = new RegExp(`\\${LEFT_SEP}@(\\d+)${MIDDLE_SEP}([^@]+)@\\${RIGHT_SEP}`, 'ig'); // /\[@(\d+):([^@]+)@\]/ig;
  let parsed = [];
  let indexes = [];

  let topicMatch,
    atMatch,
    start, end;

  // 提取标题
  while (topicMatch = reTopic.exec(content)) {

    start = topicMatch.index;
    end = start + topicMatch[0].length;

    parsed.push({
      isTopic: true,
      start: start,
      end: end,
      id: +topicMatch[1],
      text: topicMatch[2]
    });

    indexes.push(start, end);
  }

  // if (typeof options.notAt === 'undefined' || options.notAt) {
  // 提取@人信息
  while (atMatch = reAt.exec(content)) {

    start = atMatch.index;
    end = start + atMatch[0].length;

    parsed.push({
      isAt: true,
      start: start,
      end: end,
      id: +atMatch[1],
      text: atMatch[2]
    });

    indexes.push(start, end);
  }
  // }

  indexes.sort((a, b) => {
    return a - b;
  });

  // 提取文本
  for (var i = -1, len = indexes.length; /* start <= content.length && */ i < len;) {

    start = indexes[i] || 0;
    end = indexes[i + 1];

    let text = content.substring(start, end);
    i += 2;

    // 排除话题和@人紧挨着的, 此时text为空字符串
    if (text) {
      parsed.push({
        isText: true,
        text: text,
        start: start,
        end: end
      });
    }
  }

  // 加快GC
  indexes = null;

  // console.log(parsed);
  // 按下标升序
  parsed.sort((a, b) => {
    return a.start - b.start;
  });
  // console.log(parsed);

  return parsed;
}

/**
 * 解析发表的动态内容
 * @param {*} text 
 */
function parseContent(text, options) {

  if (!text) {
    text = '';
  }

  if (type(text) === 'string') {
    return _parseContent(text, options);
  }

  if (type(text) === 'array') {
    let ret = [];
    for (let i = 0, len = text.length; i < len; ++i) {
      ret.push(_parseContent(text[i], options));
    }
    return text;
  }
}

/**
 * 解析多行文本为一个数组
 * 在视频简介中, 视频介绍为\r\n分隔的字串, 对应的ui表现为换行
 */
function parseMoreLine(str, delimiter = /\r\n/) {
  // 返回的数组, 每一项为一行
  return str ? str.split(delimiter) : [];
}

/**
 * 格式化动态列表数据(解析怀表的动态文本)
 * @param {*} dl 动态列表
 */
function _formatThemes(dl) {
  dl = dl || [];

  for (let i = 0, len = dl.length; i < len; ++i) {
    let tmp = dl[i].text;
    dl[i].text = parseContent(tmp);
  }

  return dl;
}

/**
 * 将wx的api promise化, 避免回调的写法
 * @param {function} wxApi 小程序中的api名, 如wx.request
 * @param {object} options  wxApi对应的配置项列表, 实际调用时传入
 * @param {object} defaults 默认的参数对象, **限内部使用**
 */
function promisify(wxApi, options = {}, defaults = {}) {

  // 注意这里的参数顺序
  options = extend(true, {}, defaults, options);
  let {
    success,
    fail,
    complete,
    beforeRequest
  } = options;

  // 函数运行前置处理结果如果为false, 退出
  // 如果不为false, 将结果作为resolve第二个参数传入
  let beforeRet = runFn(beforeRequest);
  if (beforeRet === false) {
    return false;
  }

  return new Promise((resolve, reject) => {
    // 这三个函数的this暂时指定为wx, 以后看情况可以改, TODO
    let _success = res => {

        let successRet = runFn(success, wx, res);

        // 如果自定义回调success返回false, 意味着api调用成功, 但是结果不是预期的, 如res.result不为0
        // 这样可以根据具体业务来指定success的处理, 灵活
        if (successRet === false) {

          // 正常的话, 数据先由自己指定的success处理一遍
          reject(res, beforeRet);
        } else {
          resolve(res, successRet, beforeRet);
        }
      },
      _fail = err => {
        runFn(fail, wx, err);
        reject(err);
      },

      _complete = resOrErr => {
        runFn(complete, wx, resOrErr);
      };

    // 重写自带的回调
    options.success = _success;
    options.fail = _fail;

    // complete目前重写意义不大, 不过可以做统一处理, 比如关闭弹窗
    options.complete = _complete;

    runFn(wxApi, wx, options);
  });
}

/**
 * wx.request封装
 * @param {*} options 
 */
function request(options, recall) {

  let defaults = {
    data: {},
    method: 'GET', // 默认以GET方式传参
    header: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Cache-control': 'no-cache'
    },

    // 默认所有api请求都带sessionKey这个参数
    withSessionKey: true, // 是否在data中带session_key参数
    withMinaFlag: true, // 是否在data中带is_mina = 1这个参数
    withLocation: false, // 是否带地理位置参数

    autoHideLoading: true, // 是否为自动关闭loading窗, 默认true,

    withWXLoginCode: true, // 是否带wx.login res=> cdoe

    // 当前页面的路径及打开的方式
    // 如果没有登录或者绑定, 会跳转到auth页面, 
    // 登录成功后会以openType到指定的url
    // currPageInfo: {
    //   url: '/pages/index/index',
    //   openType: 'reLaunch'
    // },

    /**
     * 前置处理, 比如加载loading
     */
    beforeRequest: () => true,

    /**
     * 请求完成之后统一处理
     */
    complete: d => {
      console.log('complete1', d, options);

      // 执行一些"清理"工作
      try {

        // wx.hideLoading();

        if (options.autoHideLoading) {
          setTimeout(() => {
            console.log('complete hideloading');
            wx.hideLoading();
          }, 200);

          setTimeout(() => {
            console.log('complete hideloading');
            wx.hideLoading();
          }, 500);
        }

        wx.hideNavigationBarLoading(); //完成停止加载
        wx.stopPullDownRefresh(); //停止下拉刷新
      } catch (e) {}
    },

    fail: err => {},

    /**
     * res.result为0是成功, 否则为失败
     */
    success: res => {
      console.log('success1', res);

      if (!res) {
        throw new Error('api error');
      }

      let data = res.data;

      return data;
    }
  }

  options = extend(true, {}, defaults, options)

  if (options.withSessionKey === true) {
    let sk = _getStorageSync();

    if (sk) {
      options.data.session_key = sk;
    } else {
      console.warn('request(), _getStorageSync error');
      // showModal
    }
  }

  if (!options.data.session_key && options.withSessionKey === true) {
    console.warn('request session_key is null', options);
  }

  // 标志是小程序的请求 [三茅问答小程序(mintype = 2)]
  if (options.withMinaFlag !== false) {
    options.data.is_mina = 1;
    options.data.mintype = 2;
  }

  // latitude	纬度，浮点数，范围为-90~90，负数表示南纬	
  // longitude	经度，浮点数，范围为-180~180，负数表示西经	
  // speed	速度，浮点数，单位m/s	
  // accuracy	位置的精确度
  // 添加位置信息
  // if (options.withLocation === true) {
  //   let loc = _getStorageSync('userLocation');

  //   if (loc) {
  //     options.data.latitude = loc.latitude;
  //     options.data.longitude = loc.longitude;
  //   }
  // }

  // return util.promisify(wx.request, options, defaults);

  return new Promise((resolve, reject) => {

    wx.request({
      url: options.url,
      data: options.data,
      method: options.method, // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
      // header: {}, // 设置请求的 header
      header: options.header,
      success: res => {
        console.log('success', res);

        let data = res.data;
        // 这里要看数据格式
        // if (typeof data.result === 'boolean' && data.result !== true) {
        if (data.result === 999 || data.result === 100) {
          console.warn('request, result !== true to handleErrApi ->', options.url, data);
          handleErrApi(data.result, res, options, recall);
        }
        
        let successRet = runFn(options.success, wx, res);

        // 如果自定义回调success返回false, 意味着api调用成功, 但是结果不是预期的, 如res.result不为0
        // 这样可以根据具体业务来指定success的处理, 灵活
        if (successRet === false) {
          // console.info('reject')
          // 数据先由自己指定的success处理一遍
          reject(res);
        } else {
          // console.info('resolve')
          resolve(successRet);
        }
      },
      fail: err => {
        console.warn('fail', err);
        reject(err);
        runFn(options.error, null, err);
      },
      complete: resOrErr => {
        console.warn('complete', resOrErr);
        runFn(options.complete, null, resOrErr);
      }
    })
  });
}

/**
 * 验证图形验证码是否正确, 获取短信验证码时, 接口内部有自动判断, 所以此方法废弃
 * @param {*} captcha 
 */
// function verifyCaptcha(captcha) {
//   return request({
//     url: config.apiUrl + '/hrloo56.php?m=api&c=index&a=chkVerifycode',
//     method: 'POST',
//     withMinaFlag: false,
//     // withSessionKey: false,
//     data: {
//       code: captcha
//     }
//   }).then(res => {
//     // console.log(res);

//     let result = res.result;

//     if (result === 0) {
//       return Promise.resolve();
//     }

//     return Promise.reject();
//   });
// }

/**
 * 用获取到的code, 调用后台接口, 获取sessionKey
 * @param {*} code 
 * @param {boolean} autoSaveSessionKey 获取到sessionKey后要不要存储, 默认为true
 */
function _getSessionKeyByApi(code, autoSaveSessionKey = true) {

  return request({
    url: config.apiUrl + '/hr/special/wxapp/init',
    data: {
      code: code
    },
    method: "POST",
    withSessionKey: false
  }).then(res => {
    
    // console.warn('_getSessionKeyByApi ->>>', res)

    // //后端未上线时的处理/上线后可删除
    // if (type(res) != 'object') {
    //   // console.info('res ->>>', res)
    //   // wx.navigateBack()
    //   return;
    // }

    //绑定了三茅账号
    if (res.result === 0) {

      if (autoSaveSessionKey) {
        _setStorageSync('hauth', res.data.hauth);
        _setStorageSync('sessionKey', res.data.session_key);
        _setStorageSync('isLogin', 1);
        _setStorageSync('isBindSanMao', 1);
        console.log('绑定了三茅账号')
        console.info('sessionKey save done')

        // 存储ws需要的token
        //_setStorageSync('hauth', res.data.hauth);
      }

      return Promise.resolve(res);

    } else if (res.result === 1) {

      console.warn('_getSessionKeyByApi(), code is invalid: ', res);
      return Promise.reject(res);
    } else if (res.result === 2) {

      _setStorageSync('hauth', res.data.hauth);
      _setStorageSync('sessionKey', res.data.session_key);
      _setStorageSync('isLogin', 0);
      _setStorageSync('isBindSanMao', 0);
      console.log('11111111', _getStorageSync())
      return Promise.reject(res);
    }

    // result: 0、已经绑定 1、重新发送code 2、未绑定
    // if (res.result !== 1) {
    //   if (autoSaveSessionKey) {
    //     _setStorageSync('sessionKey', res.data.session_key);

    //     // 存储ws需要的token
    //     _setStorageSync('hauth', res.data.hauth);
    //   }

    //   return Promise.resolve(res);
    // } else {
    //   console.warn('_getSessionKeyByApi(), code is invalid: ', res);

    //   return Promise.reject(res);
    // }
  }).catch(err => {
    console.log('err: ', err);
  });
}

/**
 * 通过wx.login获取登录凭证 code
 */
function _getCode() {
  return promisify(wx.login).then(res => {
    let code = res.code;
    console.log('code',code)
    if (code) {
      return Promise.resolve(code);
    } else {
      console.warn('then{}, 获取code出错', res);
      return Promise.reject(res);
    }
  }).catch(err => {
    console.log('catch{}, 获取code出错', err);
  });
}

/**
 * 重新登录, 刷新sessionKey
 * 这个方法会自动设置sessionKey到storage
 */
function updateSessionKeyApi() {

  let _authinfo = _getStorageSync('authinfo');

  if (!_authinfo) {
    console.warn('用户未授权')
  }

  return _getCode().then(code => {
    return _getSessionKeyByApi(code, _authinfo);
  });
}
/**
 * 判断当期登录授权用户是否是简历分享者[HR]自己
 * 如果是 则自动跳转到 简历详情页面 
 * 因为如果分享的简历是带了 密码的 就不需要展示密码输入界面 直接进入简历页
 */
function isHRSelf(code) {
  return request({
    url: config.apiUrl + '/hr/hrzp/share/w_min_is_hr',
    data: {
      share_code: code
    },
    method: "POST",
    withSessionKey: true
  }).then(res => {
    let resultcode = res.resultcode;
    //resultcode == 0就是当前登录微信用户是分享者HR自己 resultcode == 200 就不是自己
    //
    if (resultcode === 0 || resultcode === 200) {
      return Promise.resolve(resultcode);
    } else {
      // 如果是其他resultcode 状态
      console.warn('then{}, resultcode未知状态', res);
      return Promise.reject(res);
    }
  }).catch(err => {
    console.log('catch{},出错', err);
  });
  // return request({
  //   url: config.apiUrl + '/hr/hrzp/share/w_min_is_hr',
  //   data: {
  //     share_code: options.share_code
  //   },
  //   method: "POST",
  //   withSessionKey: true
  // })
}

/**
 * 多文件上传
 */
function _uploadFiles(files = [], options, customResolve) {

  if (!files || !files.length) {
    throwError('uploadFiles, files is empty');
  }

  let defaults = {
    // apiOptions: {
    url: '',
    name: 'imgFile',
    header: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Cache-control': 'no-cache'
    },
    formData: {
      session_key: _getStorageSync(),
      is_mina : 1,
      mintype: 2
    },
    filePath: ''
    // }
  };

  options = extend(true, {}, defaults, options);

  let queue = []; // 上传队列

  // 构建异步队列
  for (let i = 0, len = files.length; i < len; ++i) {
    options.filePath = files[i];
    queue.push(promisify(wx.uploadFile, options));
  }

  let uploadedFiles = [];

  // 处理队列
  return _handleQueue(queue);
  // return Promise.all(uploadedFiles);

  function _handleQueue(queue) {

    // return new Promise((resolve, reject) => {

    //   Promise.all()

    // });

    // 等所有都上传完再resolve, 较好的是上传一个, resolve一个, TODO
    return Promise.all(queue);

    // let tmp = queue.shift();

    // if (!tmp) {
    //   return true;
    // }

    // tmp.then(res => {
    //   let data = JSON.parse(res.data);

    //   if (data.result === 0) {
    //     // uploadedFiles.push(Promise.resolve(data.data.imgUrl));
    //     uploadedFiles.push(Promise.resolve(data.data.imgUrl));
    //     _handleQueue(queue);
    //   }
    // });
  }
}

/**
 * 多文件上传
 * @param {*} files 
 * @param {*} options 
 * @param {*} customResolve 
 */
function uploadFiles(files = [], options, customResolve) {

  console.log('uploadFiles, loading...');

  showLoading({
    title: '上传中...'
  });

  return new Promise((resolve, reject) => {
    _uploadFiles(files, options, customResolve).then(ress => {
      console.log('uploadFiles, all finished...', ress);

      hideLoading();

      if (customResolve) {
        return resolve(ress);
      }

      let uploadedFiles = [];

      // ress.forEach(res => {
      //   let data = JSON.parse(res.data);

      //   if (data.result === 0) {
      //     uploadedFiles.push(data.data.imgUrl);
      //   }
      // });
      // 
      for (let i = 0, len = ress.length; i < len; ++i) {
        let res = ress[i];

        let data = JSON.parse(res.data);

        if (data.result === 0) {
          uploadedFiles.push(data.data.imgUrl);
        }
      }

      resolve(uploadedFiles);
    }).catch(err => {
      hideLoading();
    });
  });
}

/**
 * 上传语音文件
 */
function uploadSink(sinkFilePath) {

  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: config.apiUrl + '/hr/group/question/silk_upload',
      header: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Cache-control': 'no-cache'
      },
      filePath: sinkFilePath,
      name: 'voice',
      formData: {
        is_mina:1,
        mintype:2,
        session_key: _getStorageSync()
      },
      success: function(res) {
        console.log('uploadSink', res);
        console.log('_getStorageSync()', _getStorageSync())
      
        let d = res.data;
        d = JSON.parse(d);

        res.data = d;

        if (d.result === 0) {
          resolve(d.data);
        } else {
          console.log('上传失败res',res)
          wx.hideLoading()
          wx.showToast({
            title: '上传失败,请重试',
            icon: 'none'
          })
          // reject(res);
          handleErrApi(d.result, res, {
            url: config.apiUrl + '/hr/special/wxapp_video/silk_upload',
          });
        }
      },
      fail: function(err) {
        console.log('skin upload failed', err);
        reject(err);
      }
    });
  });

}

/**
 * 统计字符串的长度，汉字和全角当作两个字符，字母和半角当作一个字符
 * @param {string} str 字符串 半角为一个字符
 * @returns len 统计的长度
 */
function halfStringLen(str) {

  if (str == null) {
    return 0;
  }

  if (typeof str !== 'string') {
    throwError('halfStringLen(), arg str must be a string');
  }

  let len = 0;

  for (let i = 0, l = str.length; i < l; i++) {
    let strCode = str.charCodeAt(i);
    if (/^[\u4E00-\u9FA5\uF900-\uFA2D]+$/.test(str[i]) || strCode > 255) {
      len += 2;
    } else {
      len += 1;
    }
  }
  return len;
}

/**
 * 统计字符串的长度，汉字和全角当作一个字，字母和半角当作半个字
 * @param str 字符串 全角汉字为一个字符
 * @returns len 统计的长度
 */
function fullStringLen(str) {
  var len = 0;
  var sem_len = 0;
  for (var i = 0; i < str.length; i++) {
    var strCode = str.charCodeAt(i);
    if (new RegExp('^[\\u4E00-\\u9FA5\\uF900-\\uFA2D]+$').test(str[i]) || strCode > 255)
      len += 1;
    else
      sem_len++;
  }
  if (sem_len % 2 === 0)
    len += Math.floor(sem_len / 2);
  else
    len += Math.ceil(sem_len / 2);
  return len;
}

/**
 * JS 对中英文混编的字符串进行截取
 * 测试 alert(subString("js字符串test截取测试",5,"……")); 
 * @param {*} str 
 * @param {*} len 一个汉字为2, 英文字母为1 
 * @param {*} preStr 
 */
function subString(str, len, preStr) {
  var newLength = 0;
  var newStr = "";
  var chineseRegex = /[^\x00-\xff]/g;
  var singleChar = "";
  var strLength = str.replace(chineseRegex, "**").length;
  for (var i = 0; i < strLength; i++) {
    singleChar = str.charAt(i).toString();
    if (singleChar.match(chineseRegex) != null) {
      newLength += 2;
    } else {
      newLength++;
    }
    if (newLength > len) {
      break;
    }
    newStr += singleChar;
  }
  if (strLength > len) {
    if (preStr && preStr.length > 0) {
      newStr += preStr;
    }
  }
  return newStr;
}

/**
 * 生成GUID
 */
function guid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 同步获取storage
 * @param {*} key storage的key, 默认是sessionKey
 */
function _getStorageSync(key = 'sessionKey') {
  try {
    let value = wx.getStorageSync(key);
    if (value) {
      return value;
    }
    return false;
  } catch (e) {
    throwError('_getStorageSync err ', e);
    return false;
  }
}

/**
 * 以同步方式设置小程序的storage
 * @return 如果成功,返回true, 否则返回false
 */
function _setStorageSync(key, val) {
  try {
    wx.setStorageSync(key, val);
    return true;
  } catch (e) {
    console.log('_setStorageSync err ', e);
    return false;
  }
}

/**
 * 获取生成小程序二维码需要的scene
 * @param {*} path 页面路径, 可带参数, 路径任意
 */
function saveSceneApi(path = '' /*, params */ ) {

  if (!path) {
    throwError('saveSceneApi, path can not be null');
  }

  return request({
    url: config.apiUrl + '/hr/special/wxapp/save_scene',
    withSessionKey: false,
    data: {
      path: path
    }
  }).then(res => {
    if (res.result === 0) {
      return Promise.resolve(res.data.scene)
    }

    console.warn('saveSceneApi, err', res);
  }, err => {
    console.warn('saveSceneApi, err', err);
  });
}


/**
 * 通过scene(分享出去的二维码图片扫了之后, 在onLoad中可取到)
 * // var scene = decodeURIComponent(options.scene)
 * 
 * 注意: 通过scene获取到path后, 直接调用reLaunch到path
 * 这样的话, 在有生成小程序码页面的onload中都要做相应的处理
 * TODO
 * @param {*} scene 数据库中保存的scene值, 能过它可以获取到转发时的路径 
 */
function getSharePathByScene(scene) {
  if (!scene) {
    return;
    // throwError('getSharePathByScene(), scene can not be null');
  }

  console.log('getSharePathByScene(), scene = ', scene);

  // scene = decodeURIComponent(scene);

  showToast({
    title: '',
    icon: 'loading'
  });

  return request({
    url: config.apiUrl + '/hr/special/wxapp/get_scene',
    withSessionKey: false,
    data: {
      scene: scene
    }
  }).then(res => {

    hideToast(200);

    if (res.result === 0) {
      // return Promise.resolve(res.data);

      // res.data是路径(带querystring)
      return Promise.resolve(parseUrl(res.data.path));

      // 这种方式简单, 但是不好
      // var scene = decodeURIComponent(options.scene);
      // getSharePathByScene(scene).then(path => {
      //   gotoPage({
      //     url: '/' + path, // 注意加上/
      //     openType: 'reLaunch'
      //   })
      // });
    }

    console.warn('getSharePathByScene(), result !== 0', res);
  }, err => {
    hideToast(200);
    console.warn('getSharePathByScene(), err', err);
  });
}

/**
 * 处理api异常
 * @param {*} result 
 * @param {*} res 
 * @param {*} options 
 */
function handleErrApi(result, res, options = {}, recall) {

  // console.info('handleErrApi-result-res-options->', result, res, options)

  // 错误码映射
  // ERR_MAPPING: {
  //   NOT_LOGIN: 100, // 未登录
  //   SHARE_CANCEL: 301, //对方已取消分享
  //   SHARE_EXPIRE: 302, //分享链接已过期
  //   SHARE_RESUME_NONE: 401, // 简历不存在
  //   SESSION_KEY_EXPIRED: 999, // sessionKey过期
  // }

  // 你还没有登录
  if (result === config.ERR_MAPPING.NOT_LOGIN) {
    _setStorageSync('isLogin', 0);
    _setStorageSync('isBindSanMao', 0);
    console.log("未登录")
    return;
  }

  // SESSION_KEY_EXPIRED 999 sessionKey 已经过期
  if (result === config.ERR_MAPPING.SESSION_KEY_EXPIRED) {
    //console.info('updateSessionKeyApi')
    //_setStorageSync('isLogin', 0);

    //默认更新sessionKey
    // return updateSessionKeyApi().then(res => {
    //   //更新重调 参数 sessionKey
    //   options.session_key = _getStorageSync()
    //   //执行重调 
    //   if (isFunction(recall)) {
    //     return runFn(recall)
    //   } else {
    //     console.warn('warn -> recall is not function')
    //     return;
    //   }
    // })
    return promisify(wx.showModal, {
      title: '登录已经过期,请重新登陆',
      // content: '您还没有登录'
    }).then(res => {

      if (options.url.indexOf(config.authorizationURL) >= 0) {
        console.warn('now you are at auth page');
      } else {
        //去登陆页面
        let authUrl = addParam2url(config.authorizationURL, 'back', '1');
        gotoPage({
          url: authUrl,
          openType: 'navigateTo'
        });
      }
    });

    

    // options.url = options.url || '';
    // var currPages = getCurrentPages(),
    //   currPage = currPages[currPages.length - 1].route;
    // if (options.url.indexOf('/pages/auth/auth') >= 0) {
    //   console.warn('now you are at auth page');
    // } else {
    //   authUrl = addParam2url(authUrl, 'action', '1');

    //   // 对登录页面特殊处理
    //   if (currPage.indexOf('auth/auth') < 0) {
    //     gotoPage({
    //       url: authUrl
    //     });
    //   } else {

    //   }

    // }



    return;
  }

}

/**
 * 从像册选择图片
 * @param {*} options 
 */
function chooseImage(options) {
  return promisify(wx.chooseImage, {}, {
    count: 9,
    sizeType: ['original', 'compressed'], // original 原图，compressed 压缩图，默认二者都有
    sourceType: ['album', 'camera'] // album 从相册选图，camera 使用相机，默认二者都有

  }).then(res => {
    return Promise.resolve(res);
  }).catch(err => {
    return Promise.reject(err);
  });
}

function gotoPage(options) {

  let defaults = {
    url: '',
    openType: 'navigateTo', // 跳转方法, 这里直接以方法名给出, 如wx.**navigateTo**
    delta: 1,

    // 超出页面栈限制, 如何处理看产品
    fail: function(err) {
      console.log('超出页面栈!', err, getCurrentPages());
    }
  };

  options = extend(true, {}, defaults, options);
  let openMethod = wx[options.openType];

  if (!isFunction(openMethod)) {
    throwError('gotoPage, openMethod is not a function');
  }

  if (!options.url && options.openType !== 'navigateBack') {
    throwError('gotoPage, url can not be null!');
  }
  return promisify(openMethod, options);
}

/**
 * 动态列表中,删除一条动态, 会修改原数据
 * @param {*} originalDL 
 * @param {*} dlId 
 */
function delDynFromDL(originalDL, dynId) {
  originalDL = originalDL || [];

  for (let i = 0, len = originalDL.length; i < len; ++i) {

    if (originalDL[i].id == dynId) {
      originalDL.splice(i, 1);
      break;
    }
  }

  return originalDL;
}

/**
 * 举报
 * @param {*} replyid 评论id
 */
function reportApi(replyid, options) {

  let defaults = {
    url: config.apiUrl + '/hr/pl/pl/report',
    method: 'POST',
    data: {},
    autoHideLoading: false,
    objType: 'dynamic', // 默认在动态下评论
  };

  let typeMapping = {
    dynamic: 2,
    article: 7, // 文章
  };

  options = extend(true, defaults, options);

  options.data['data[replyid]'] = replyid;
  // options.data['data[type]'] = 2;
  options.data['data[type]'] = typeMapping[options.objType];
  options.data['data[source]'] = 2;

  delete options.objType;

  return isLoginAndIsBindSanMao().then(res => {
    return request(options).then(res => {

      // console.log(res);
      if (res.result === 0) {
        showToast({
          title: '已举报'
        });
        return Promise.resolve(res);
      } else {

        showModal({
          content: res.msg || '举报失败',
        });
      }

    }).catch(err => {
      throwError('reportApi, err', err);
    });
  });

}

function praiseApi(url, data, method = 'GET') {
  return request({
    url: url,
    data: data,
    method: method
  }).then(res => {

    // console.log(res);
    if (res.result === 0) {
      return Promise.resolve(res);
    } else {

      // 已经点过赞了
      if (res.result === 1) {
        return Promise.resolve(res);
      }

      // showModal({
      //   content: res.msg || '点赞失败',
      // });
    }

  }).catch(err => {
    throwError('praiseApi, err', err);
  });
}

/**
 * 动态/文章 点赞
 * @param {int} id 动态id
 */
function dynamicPraise(id, objType) {

  // 动态点赞
  if (objType === 'dynamic') {
    return praiseApi(config.apiUrl + '/hr/experience/theme/ajax_theme_star', {
      tid: id
    });
  }

  // 文章点赞
  if (objType === 'article') {
    return praiseApi(config.apiUrl + '/hrloo.php?m=rz&c=rz&a=ajax_operate', {
      blogid: id,
      option: 1
    }, 'POST');
  }
}

/**
 * 动态下的评论点赞
 * @param {int} id 评论id replyid
 */
function commentPraise(id, objType = 'dynamic') {

  let typeMapping = {
    dynamic: 2,
    article: 7, // 文章
  };

  return praiseApi(config.apiUrl + '/hr/pl/pl/zan', {
    replyid: id,
    type: typeMapping[objType]
  }, 'POST');
}

/**
 * 字符串左右填充字符串, 如 wrapStr('abc', '#', '#') => '#abc#'
 * @param {*} str 
 * @param {*} left 
 * @param {*} right 
 */
function wrapStr(str, left, right = left) {
  return left + str + right;
}

/**
 * {key: val} => {data[key]: val}
 * @param {*} data 
 */
function wrapDataKey(data = {}) {

  let ret = {};

  for (let p in data) {
    if (hasOwn.call(data, p)) {
      ret['data[' + p + ']'] = data[p];
    }
  }

  return ret;
}

function getSystemInfoSync() {
  try {
    let systemInfo = wx.getSystemInfoSync();;
    //console.log('成功获取系统信息:', systemInfo);
    return systemInfo;
  } catch (e) {
    return null;
  }
}

// @toast
function showToast(options) {

  let defaults = {
    duration: 1500
  };
  options = extend({}, defaults, options);

  return promisify(wx.showToast, options);
}

/**
 * 加timeout配置
 * @param {*} timeout 
 */
function hideToast(timeout = 0) {
  setTimeout(() => {
    wx.hideToast();
  }, timeout)
}
// @@toast

// @loading
function showLoading(options) {
  let defaults = {
    mask: true
  };
  options = extend({}, defaults, options);

  return promisify(wx.showLoading, options);
}

/**
 * 关闭loading
 * 这玩意连toast也会关闭...
 * 由于wx.hideloaind这个api同步调用, 有时会失效, 所以要异步调用
 * 为了保证能关闭, 多关闭几次
 * 为了保证不报错, 使用try-catch
 * 
 * @param {boolean} direct 是否直接关闭(不带延时), 默认为false
 */
function hideLoading(direct = false) {
  try {

    if (direct) {
      wx.hideLoading();
      return;
    }

    let delays = [200, 500];
    for (let i = 0, len = delays.length; i < len; ++i) {
      setTimeout(() => {
        console.log('wx.hideLoading');
        wx.hideLoading();
      }, delays[i]);
    }
  } catch (e) {
    console.log('util.hideLoading, err: ', e);
  }
}
// @@loading

/**
 * modal
 * @param {*} options 
 */
function showModal(options) {

  let defaults = {
    showCancel: false,

  };
  options = extend({}, defaults, options);

  return promisify(wx.showModal, options).then(res => {
    console.log('showModal', res);
    if (res.confirm) {
      return Promise.resolve(true);
    }

    // 当点击空白区域(不点取消, 也不点确定)
    // res.confirm 和 res.cancel 这两个都是false
    // 这是wx的bug
    if (!res.confirm && !res.cancel) {
      return Promise.reject(true);
    }

    return Promise.reject(false);
  });
}

// function _(originalDL, dynamicId, commentList, commentResData) {

// }

/**
 * 添加评论到动态列表中, 会修改原动态列表的数据
 * @param {*} originalDL 原来存在的动态列表
 * @param {*} commentResData 评论成功后返回的数据, 由于字段名不一致
 */
function addComment2dl(originalDL, commentResData) {

  if (!originalDL) {
    throwError('addComment2dl(), originalDL is null');
  }

  commentResData.pid = commentResData.pid - 0 || 0;

  for (let i = 0, len = originalDL.length; i < len; ++i) {
    let d = originalDL[i];

    if (d.id == commentResData.tid) {
      d.comment = d.comment || {};

      d.comment.allCount = d.comment.allCount || 0;
      ++d.comment.allCount;

      d.comment.list = d.comment.list || [];
      d.comment.list.unshift(commentResData);

      // 取前5个
      d.comment.list = d.comment.list.slice(0, 5);
      break;
    }
  }

  return originalDL;
}


/**
 * 动态列表 给动态点赞
 * dynamicIndex: 点赞的动态的索引
 */
function praiseDL(originalDL, dynamicIndex, star_res) {
  if (!originalDL) {
    throwError('praiseDL(), originalDL is null');
  }

  let d = originalDL[dynamicIndex];
  d.is_star = 1;
  d.user_star = star_res;
  d.star_count = +d.star_count + 1;


  // for (let i = 0, len = originalDL.length; i < len; ++i) {
  //   let d = originalDL[i];

  //   if (d.id == dynamicId) {
  //     d.is_star = 1;
  //     d.user_star = star_res;
  //     d.star_count = +d.star_count + 1;
  //     break;
  //   }
  // }

  return originalDL;
}

/**
 * 从动态列表中获取相应的评论对象
 * @param {*} originalDL 
 * @param {*} commentId 
 */
function getDLComment(originalDL, commentId) {
  if (!originalDL) {
    throwError('getDLComment(), originalDL is null');
  }

  for (let i = 0, len = originalDL.length; i < len; ++i) {
    let d = originalDL[i];

    d.comment = d.comment || {};

    let cl = d.comment.list || [];

    for (let j = 0, len2 = cl.length; j < len2; ++j) {
      let c = cl[j];

      if (c.id == commentId) {
        return c;
      }
    }
  }

  return null;
}

/**
 * 动态列表 给回复点赞
 */
function praiseDLComment(originalDL, commentId) {
  if (!originalDL) {
    throwError('addComment2dl(), originalDL is null');
  }

  // for (let i = 0, len = originalDL.length; i < len; ++i) {
  //   let d = originalDL[i];

  //   d.comment = d.comment || {};

  //   let cl = d.comment.list || [];

  //   for (let j = 0, len2 = cl.length; j < len2; ++j) {
  //     let c = cl[j];

  //     if (c.id == commentId) {
  //       if (!c.zan) {
  //         c.zan = 1;
  //       } else {
  //         c.zan = +c.zan + 1;
  //       }
  //       c.user_zan = true;
  //       break;
  //     }
  //   }
  // }
  let c = getDLComment(originalDL, commentId);

  if (!c.zan) {
    c.zan = 1;
  } else {
    c.zan = +c.zan + 1;
  }
  c.user_zan = true;

  return originalDL;
}

/**
 * onshow/onhide bug:
 * 
 * 预览图片前后会调用
 * onShareAppMessage前后会调用
 * 
 * 对这些情况, 本地设置一个标志, 在动作进行前, 设置
 * 动作结束后, 删除
 * 如果发现有标志, 可进行相应的处理
 * 
 * 函数: setPreviewFlag clearPreviewFlag isPreviewed就是为了处理这个bug
 * 
 */
function setPreviewFlag() {
  _setStorageSync('isPreview', 1);
}

function clearPreviewFlag() {
  _setStorageSync('isPreview', 0);
}

function isPreviewed() {
  return _getStorageSync('isPreview') == 1;
}

// current: '', // 当前显示图片的http链接
// urls: [] // 需要预览的图片http链接列表
function previewImage(options) {
  setPreviewFlag();
  return promisify(wx.previewImage, options);
}

/**
 * 判断是否登录, 未登录直接跳转到登录页面
 * @param {string} from 从哪个页面来
 */
function isLoginAndIsBindSanMao(openType = 'reLaunch', from = '', dontGotoAuth = false) {
  // let pages = getCurrentPages(),
  //   currPage = pages[pages.length - 1],
  //   route = '/' + currPage.route,
  //   options = currPage.options;

  // console.log(pages);

  // if (!from) {
  //   from = addParam2url(route, options);
  // }

  let isBind = _getStorageSync('isBindSanMao');
  // let authUrl = '/pages/auth/auth?from=' + encodeURIComponent(from) + '&openType=' + openType;
  let authUrl = '/pages/auth/auth';

  if (!(+isBind)) {

    if (!dontGotoAuth) {
      updateSessionKeyApi();
      gotoPage({
        url: authUrl
      });
    }

    return Promise.reject(true);
  }

  return isLogin().then(is => {
    if (!is) {

      if (!dontGotoAuth) {
        updateSessionKeyApi();
        gotoPage({
          url: authUrl
        });

        return Promise.reject(true);
      }
      return Promise.reject(true);
    }
    return Promise.resolve(true);
  });
}

/**
 *  聊天页面判断登录, 包含ws登录需要的token(hauth值)
 */
function isLoginWS(openType = 'reLaunch', from = '') {
  return isLoginAndIsBindSanMao(openType, from).then(() => {
    let hauth = !!_getStorageSync('hauth');

    if (hauth) {
      return Promise.resolve(hauth);
    } else {

      gotoPage({
        url: '/pages/auth/auth'
      });
      return Promise.reject();
    }

  });
}

/**
 * 由storage中的sessionKey来判断是否"登录"
 */
function isLogin() {
  let is = _getStorageSync('isLogin');

  return +is ? Promise.resolve(true) : Promise.resolve(false);
}

/**
 * 是否绑定三茅账号
 */
function isBindSanMao(opts, autoSaveSessionKey = true) {

  return _getCode().then(code => {
    return _getSessionKeyByApi(code, autoSaveSessionKey);
  }).then(res => {
    console.info('res', res)
    // 0、已经绑定 1、重新发送code 2、未绑定
    let result = res.result;

    if (result === 0) {
      return Promise.resolve(true);
    } else if (result === 1) {
      console.log('isBindSanMao(), code is invalid');
      return Promise.resolve(false);
    } else if (result === 2) {
      return Promise.resolve(false);
    }
  }).catch(err => {
    console.warn('isBindSanMao(), err', err);
  });
}

function checkBindApi() {

  // return isLoginAndIsBindSanMao

  // 判断当前微信账号是否有已绑定的三茅账号
  return isBindSanMao().then(isBind => {
    // 是，则直接登录(如果是已经绑定, 就认为已经登录了, 后续调用获取动态列表就可以)
    if (isBind) {
      return Promise.resolve(true);
    }

    // 否则, 进入微信绑定流程。
    else {
      // util.gotoPage({
      // 	url: '/pages/auth/auth',
      // 	openType: 'navigateTo'
      // });
      return Promise.resolve(false);
    }
  });
}


/**
 * 微信, 获取用户信息
 */
function wxGetUserInfo() {

  return promisify(wx.getUserInfo, {})
    .then(res => {
      console.log('wxGetUserInfo(), success', res);
      _setStorageSync('authInfo', res);

      // 这里要继续往下传, 不然在外部中取不到
      return Promise.resolve(res);
    })
    .catch(err => {
      console.warn('用户拒绝获取个人信息', err);
      _setStorageSync('authInfo', '');
      return Promise.reject(err);
    });
}

/**
 * 判断是否授权过地理信息
 */
function hasAuthGeo() {
  let geoInfo = _getStorageSync('userLocation');

  return !!geoInfo;
}

function getGeoInfo() {
  return _getStorageSync('userLocation') || {};
}

/**
 *  scope.userInfo	wx.getUserInfo	用户信息
    scope.userLocation	wx.getLocation, wx.chooseLocation	地理位置
    scope.address	wx.chooseAddress	通讯地址
    scope.invoiceTitle	wx.chooseInvoiceTitle	发票抬头
    scope.werun	wx.getWeRunData	微信运动步数
    scope.record	wx.startRecord	录音功能
    scope.writePhotosAlbum
 */
function openSetting() {
  return promisify(wx.openSetting).then(res => {
    let authSetting = res.authSetting;
    let ret = {};

    // 都有前缀'scope.', 去掉, 节省字节
    for (let p in authSetting) {
      ret[p.replace(/^scope\./, '')] = !!authSetting[p];
    }

    console.log('openSetting:', ret);
    return Promise.resolve(ret);

  }).catch(err => {
    return Promise.reject(err);
  });
}

/**
 * wx.getLocation二次封装
 * @param {*} save 
 */
function wxGetLocation(save = true) {
  return promisify(wx.getLocation, {
    type: 'wgs84', // 默认为 wgs84 返回 gps 坐标，gcj02 返回可用于wx.openLocation的坐标
  }).then(res => {

    console.log(res);

    if (save) {
      _setStorageSync('userLocation', res);
    }

    return Promise.resolve(res);
  }).catch(err => {
    console.log(err);
    return Promise.reject(err);
  });
}

/**
 * 调用api获取三茅用户信息
 * * 如果是请求 我的  的数据  加个参数 mine = 1
 */
function getUserInfoSanMaoApi(uid, mine = 0) {
  return request({
    // url: config.apiUrl + '/hr/experience/theme/theme_list_mini',
    url: config.apiUrl + '/hr/uc/user/profile',
    data: {
      mine: mine,
      uid: uid
    },
    withLocation: false,
  }).then(res => {
    console.log(res);

    if (!res) {
      return Promise.reject(res);
    }

    let result = res.result;

    if (result === 0) {
      return Promise.resolve(res);
    }

    return Promise.reject(res);
  });
}

/**
 * 将一个对象的key按前缀分组, 如
 * obj = {
 *  abc: 1,
 *  def: 2
 * }
 * 
 * groupProp(obj, ['a', 'd']):
 *  {
 *    a: {
 *      abc: 1
 *    },
 *    d: {
 *      def: 2
 *    }
 * }
 * 
 * @param {*} obj 
 * @param {*} props 
 * reserveProp, 是否保留原key的名称, 如 dynUserid => dynid
 */
function groupProp(obj = {}, props = [], reserveProp = true) {
  if (!obj || !props || !props.length) {
    return obj;
  }

  let ret = {
    other: {}, // 没有对应的前缀的
  };

  for (let p in obj) {
    for (let i = 0, len = props.length; i < len; ++i) {
      let prop = props[i];

      // 确保是以prop开始
      if (p.indexOf(prop) === 0) {

        if (isUndef(ret[prop])) {
          ret[prop] = {};
        }

        // prop = 'dyn', obj[prop] => obj[dynUserid] =>  obj[userid]
        if (reserveProp) {
          ret[prop][p.replace(new RegExp('^' + prop), '').toLowerCase()] = obj[p];
        } else {
          ret[prop][p] = obj[p];
        }
      } else {
        ret.other[p] = obj[p];
      }
    }
  }

  return ret;
}

/**
 * 
 * @param {*} eleSel 元素选择器
 */
function getRect(eleSel, callback) {
  // return new Promise((resolve, reject) => {
  // 这个方法不会立即返回, 在onload中写的都不行, 还得setTimeout一下...

  let query;

  getRect.t = getRect.t || 0; // 超时时间累积
  let delay = 10; // 每隔delay毫秒获取一次

  if (!query) {
    query = wx.createSelectorQuery().select(eleSel).boundingClientRect();
  }

  query.exec(function(rect) {
    let r0 = rect[0];

    if (!r0 || !r0.height) {
      setTimeout(function() {
        getRect.t += delay;

        if (getRect.t > 1000) {
          return;
        }
        getRect(eleSel, callback);

      }, delay);
    } else {

      // callback回传rect[0], 即第一个
      callback(r0);
    }
  });
  // });
}

// /**
//  * 切换动态列表中评论, 举报ui的显示隐藏
//  * @param {*} i 
//  * @param {*} j 
//  * @param {*} show 
//  */
// function toggleReportUI(i, j, show = true) {

// }

/**
 * generate random number between min and max, both include(also mean [min, max])
 * @param {*} min 
 * @param {*} max 
 */
function random(min = 0, max = 10) {
  return min + Math.floor((max - min + 1) * Math.random());
}

/**
 * 随机取数组中的一个元素
 * @param {*} arr 
 */
function randomEle(arr) {
  return arr[random(0, arr.length - 1)];
}

/**
 * 提取一个对象中的部分属性
 * @param {*} obj 
 * @param {*} keys 需要的属性key列表
 */
function extractPartial(obj, keys) {
  if (!obj) {
    return null;
  }

  // 复制自己
  if (!keys || !keys.length) {
    return extend(true, {}, obj);
  }

  let ret = {};

  for (let p in obj) {

    // 提取需要的属性
    if (keys.indexOf(p) >= 0) {
      ret[p] = obj[p];
    }
  }

  return ret;
}

/**
 * 获取触摸位置
 * @param {*} e 
 */
function getTouchPosition(e) {
  const touches = e.touches[0];
  return {
    x: touches.pageX,
    y: touches.pageY,
  };
}

// function getRecordFile(timeout) {

//   wx.stopRecord({
//     success: function(res) {
//       console.log(res);
//     }
//   });
// }

/**
 * 获取后台音乐播放状态。
 */
function getBGAudioState() {
  // return promisify(wx.getBackgroundAudioPlayerState).then(res => {
  //   return Promise.resolve(res);
  // });
  // status	播放状态（2：没有音乐在播放，1：播放中，0：暂停中）
  wx.getBackgroundAudioPlayerState({
    success: function(res) {
      console.log(res);
      // var status = res.status
      // var dataUrl = res.dataUrl
      // var currentPosition = res.currentPosition
      // var duration = res.duration
      // var downloadPercent = res.downloadPercent
      // console.log(res);
    },

    complete(data) {
      console.log('complete,', data);
      return;
    }

  })
}

/**
 * @param {*} delay 延时时间, 默认不设置延时
 * @param {function} callback 停止刷新后的回调
 */
function wxStopPullDownRefresh(delay, callback) {

  if (delay) {
    setTimeout(function() {
      wx.stopPullDownRefresh();
      runFn(callback);
    }, delay);
  } else {
    wx.stopPullDownRefresh();
    runFn(callback);
  }
}

function wxStopRecord() {
  setTimeout(function() {
    wx.stopRecord();
  }, 100);
}

/**
 * 自动登录
 */
function autoLogin() {

  // 未登录, 再刷新session_key
  return isLoginAndIsBindSanMao(void 0, void 0, true).catch(() => {
    _setStorageSync('isLogin', 1);
    return checkBindApi().then(isBind => {
      _setStorageSync('isBindSanMao', isBind ? 1 : 0);

      return Promise.resolve(true);
    });
  });
}

/**
 * 
 * 未登录也可以点播放, 另行处理, 因为要跳页面, 这个用参数控制
 * 
 * 当前能否播放视频
 * @param {*} v video对象
 * @param {boolean} notLoginCanPlay 未登录是否可以播放 默认为true
 */
function canPlayVideo(v, notLoginCanPlay = true) {
  let s = v.state - 0,
    vS = config.videoStatusMapping;

  return s === vS.canPlay || s === vS.notLogin && notLoginCanPlay;
}

/**
 * 解析用户授权使用个人信息成功后的返回
 * @param {*} userInfoRes 
 */
function parseWXUserInfoRes(userInfoRes) {
  /// {"errMsg":"getUserInfo:ok","rawData":"{\"nickName\":\"开心就好\",\"gender\":1,\"language\":\"zh_CN\",\"city\":\"Xianyang\",\"province\":\"Shaanxi\",\"country\":\"China\",\"avatarUrl\":\"https://wx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTKgD1Hno5lShoGesmSSiaogp4dcwxINSRqaq0TcaPpXsWD1q8uao1AQm7GS0UZgPy6ibKCfJ1wuR2zg/0\"}","userInfo":{"nickName":"开心就好","gender":1,"language":"zh_CN","city":"Xianyang","province":"Shaanxi","country":"China","avatarUrl":"https://wx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTKgD1Hno5lShoGesmSSiaogp4dcwxINSRqaq0TcaPpXsWD1q8uao1AQm7GS0UZgPy6ibKCfJ1wuR2zg/0"},"signature":"8ab4d076f557efd1b46b4bd8dbc1ab2e1f770a32","encryptedData":"ZyxFfYJB7jCl+KQoJnuHIib2dtYK/3+MYHaSfWz60lsLKdPaBmFsq1QHk72To8C+d7km3JE+ta+BbJdULGnjcz45WHTjSyGaUNfOgPivies46JZveDBAqZn1LlHBkMzHEnIMvA1/nwoU6jRdfTNfm54jE/x7wikJTwLCTGGPInLb61cJDaXhVA/KWmePaBKPviXJvOo51AmE5izOendYziC/CbBGa7AJCaHtj4j0KuwH7xzhUZ7IH5I8JDDe16//nuJzv7yEBYkgIxlWuBTwl++nRjJzr4b/BOB0qbPs7BXWWmpoLXIdHuNe15/w0WtKXlw75kiNFIQPSgy8L5syuBUIShfhf4j5kTv/FslAu5b3qSnXVnxvr0k9o7xrTMMoDcwvsEAsVMdB7uCNQd0AnrGDaLweAuWjzkvdq3eb82JVTDPDoNPv7as+haSZFNnNT8J0Qb1o2mhNrWSZWYTXkGM6CZxygH5GmmSiPY3PfzGIFCfyHTGmPd8TYEAFqJMvTxwKioLWS3lSWGrFFH+p2A==","iv":"TdXhqEdItwlkvV4kiSPZZw=="}

  if (!userInfoRes.userInfo) {
    throwError('no userInfo key');
  }

  return userInfoRes.userInfo;
}

/**
 * 此方法暂时废弃
 * wx.saveImageToPhotosAlbum
 * @param {string} tempFilePath 临时文件路径
 */
function wxSaveImageToPhotosAlbum(tempFilePath) {
  // return openSetting().then(res => {

  //   if (res.writePhotosAlbum) {
  //     // 保存图片到系统相册。需要用户授权 scope.writePhotosAlbum
  //     // return util.promisify(wx.saveImageToPhotosAlbum, {
  //     return promisify(wx.saveImageToPhotosAlbum, {
  //       filePath: tempFilePath
  //     })

  //     .then(res2 => {
  //       return Promise.resolve(res2);
  //     }).catch(err2 => {
  //       return Promise.reject(err2);
  //     });
  //   } else { 
  //     wxSaveImageToPhotosAlbum();
  //   }
  // });

  return promisify(wx.saveImageToPhotosAlbum, {
      filePath: tempFilePath
    })

    .then(res2 => {
      return Promise.resolve(res2);
    }).catch(err2 => {

      if (!app.GD.firstSaveImageToPhotosAlbum) {
        app.GD.firstSaveImageToPhotosAlbum = true;
        return;
      }

      // return Promise.reject(err2);
      return openSetting().then(res => {
        if (res.writePhotosAlbum) {
          return promisify(wx.saveImageToPhotosAlbum, {
            filePath: tempFilePath
          });
        } else {
          // return wxSaveImageToPhotosAlbum(tempFilePath);
          return Promise.reject();
        }
      });
    });
}

/**
 * 延时一段时间
 * @param {*} delayTime 延时时间, 默认500ms
 */
function delay(delayTime = 500) {

  return new Promise((resolve, reject) => {
    setTimeout(function() {
      resolve();
    }, delayTime);
  });
}

/**
 * 用于将一个数组, 按一行num个的形式处理并返回
 * @param {*} arr 数组
 * @param {*} num 每行几个
 * 
 * 如: 
 * input: arr = [1, 2, 3, 4, 5]
 * call: groupArray(arr, 3)
 * output: [[1, 2, 3], [4, 5]]
 */
function groupArray(arr, num = 2) {
  if (!arr || !arr.length) {
    return arr;
  }

  let len = arr.length;
  var ret = [];

  for (var i = 0; i < len; i += num) {
    ret.push(arr.slice(i, i + num));
  }

  return ret;
}

/**
 * 订阅/取消订阅 
 */
function subApi(options) {
  let defaults = {
    url: config.apiUrl + '/hr/experience/theme/oprate_sub',
    data: {},
    method: 'POST'
  };

  options = extend(true, defaults, options);

  return request(options).then(res => {

    // console.log(res);
    if (res.result === 0) {
      return Promise.resolve(res);
    } else {
      return Promise.reject(res);
    }

  }).catch(err => {
    throwError('praiseApi, err', err);
  });
}

/**
 * 购买,预支付
 */
function prepay(options) {

  let defaults = {
    url: config.videoPayUrl,
    data: {
      money: 0, // 钱数, 单位: RMB元
    }
  };

  options = extend(true, defaults, options);

  return _getCode().then(code => {

    options.data.code = code;

    return request(options).then(res => {
      return Promise.resolve(res); // nonceStr, timeStamp, signType, package, paySign等
    });
  });
}

/**
 * 微信支付
 * @param {*} options 
 */
function wxRequestPayment(options) {
  let defaults = {
    timeStamp: '',
    nonceStr: '',
    package: '',
    signType: '',
    paySign: '',
    success: function(res) {
      // success
    },
    fail: function() {
      // fail
    },
    complete: function() {
      // complete
    }
  };

  options = extend(true, defaults, options);

  return promisify(wx.requestPayment);
}

/**
 * 回复的时候的pid的取值要改下，不知道你那边改起来会不会很麻烦
 * 评论的时候pid是0  
 * 回复的时候，看评论的对象的pid是否为0 ，如果为0，pid就是回复的这条评论的id，
 * 如果不为0，pid就是回复的这条评论的pid(即保持同级，而不是变成他的子级)
 * @param {*} data 
 */
function fixCommentData(data) {

  if (data.commentobj === 'dyn') {
    return;
  }

  if (data.pid == 0) {
    data.pid = data.id;
  } else {
    // data.pid = data.pid;
  }

  delete data.id;
  delete data.commentobj;
}

/**
 * 页面滚动到st, 单位px
 * @param {*} st 
 */
function wxPageScrollTo(st) {
  wx.pageScrollTo({
    scrollTop: st || 0
  });
}

/**
 * 生成Unix时间戳
 */
function unixTimestamp() {
  return Math.floor(new Date() / 1000);
}

/**
 * 保存模板消息数据
 * @param {*} data 
 * data = {
 *  formid,
 *  type,
 *  refid, // 相应的id, 如视频详情就是视频id, 动态就是动态id
 *  path, // 模板对应的小程序页面路径, 带参数
 *  
 * }
 */
function saveTemplateMessage(data) {
  return request({
    url: config.apiUrl + '/hr/special/wxapp/save_template_message',
    method: 'POST',
    data: data
  });
}

/**
 * set/get 三茅用户信息, 本地存储
 * @param {*} key 
 * @param {*} val 
 */
function sanMaoUserInfo(key, val) {

  key = key || 'sanMaoUser';

  if (isUndef(val)) {
    return _getStorageSync(key);
  }

  return _setStorageSync(key, val);
}

/**
 * sleep n 毫秒
 * @param {*} n 
 */
function delaySync(n, startCallback, endCallback) {
  runFn(startCallback);
  var start = new Date().getTime();
  while (true) {
    if (new Date().getTime() - start > n) {
      break;
    }
  }
  runFn(endCallback);
}

/**
 * 转发时, 关闭弹窗要延时
 * @param {*} n 
 */
function fixShare(n = 200) {
  delaySync(n, function() {
    // showToast({
    //   icon: 'loading'
    // });
  }, function() {
    // hideToast();
  })
}

/**
 * 成立的逻辑的个数
 */
function logicCount(conditions = []) {

  let cnt = 0;
  for (let i = conditions.length - 1; i >= 0; --i) {
    cnt += conditions[i] ? 1 : 0;
  }

  return cnt;
}

/**
 * 保存用户观看的视频的 最后时间
 * @param {Number} endtime 秒值
 * @param {Number} courseId 课程id 
 */
function saveVideoPlayEndTime(options) {

  let defaults = {
    url: config.apiUrl + '/hr/special/wxapp_video/update_playtime',
    method: 'POST',
    data: {
      endtime: 0,
      course_id: void 0
    }
  };

  options = extend(true, defaults, options);

  return request(options);
}

/**
 * 修复文章内容的html, 好多不规范, 无语...
 */
function fixArticleHtml(html = '') {
  // return html.replace(/"=""/g, '')
  // // .replace(/ color:#\w{6};/g, '')
  // // .replace(/ font-size:\d+px;/g, '')
  // // .replace(/\s*[a-zA-Z\-]+\s*?:#?\w+\s*?;\s*(?!")/g, '');
  // .replace(/[ \t]+\s*[a-zA-Z\-]+\s*?:#?\w+\s*?;\s*(?!")/g, '');

  // return html;

  let r1 = /<(\w+)[^>]*>(?:[^<]*)<\/\1>|<(img|br|hr|span)[^>]*\s*\/?>/i;
  let m = null;


  html = html.replace(/"=""/g, '')
    .replace(/([ \t]+)?\s*[a-zA-Z\-]+\s*?:#?\w+\s*?;\s*(?!")/img, '')
    .replace(/<(a|span).+?>([^<]*)(?!<\/\1>)/ig, '$2')
    .replace(/<script.*\/?>(?:[\d\D]*<\/script>)?/img, '')
    .replace(/<img.*?src=(['"])?(.*?)\1[\d\D]*?>/ig, '<img src="$2">');
  // .replace(/<img.*src=(['"])?(.*?)\1[\d\D]*?>/ig, '<img src="$2" />');

  return html;

}


/**
 * 函数节流
 * 使用方法:
    var f = throttle(function() {
        console.log('throttle end');
    }, 2000);
    f.call({a: 1}); // 指定ctx

    function resizeHandler() {
        console.log("throttle");
    }
    window.onresize = throttle(resizeHandler, 500);
 * @param {*} action 
 * @param {*} delay 
 */
// function throttle(action, delay) {
//   delay = delay || 100;
//   var last = 0;

//   return function() {
//     var curr = +new Date();
//     if (curr - last > delay) {
//       action.apply(this, arguments);
//       last = curr;
//     }
//   };
// }

/**
 * 删除最后几个元素, 会改变原数组, 返回被删除元素组成的数组, 
 * @param {*} arr 
 * @param {*} n 
 */
function removeLastN(arr, n) {
  arr = arr || [];
  n = n || 1;

  let ret = [];
  let len = arr.length;

  if (!len || !n) {
    return ret;
  }

  // 倒数第n个, 删除n个, 也就是删除最后n个
  return arr.splice(-n, n);
}

/**
 * wx.createAnimation(OBJECT) 统一入口
 * @param {*} options 
 */
function wxCreateAni(options) {
  return wx.createAnimation(options);
}

function isApiOk(res) {
  return res && res.result === 0;
}

/**
 * 获取hr之王图片配置信息
 */
function hrkingGetImgSetting(callback) {

  let key = 'hrkingImgSetting',
    setting = _getStorageSync(key);

  // 首先从本地缓存中取
  // if (setting) {
  //   return runFn(callback, null, setting);
  // }

  // 取不到再调api
  request({
    url: config.apiUrl + '/hr/special/wxapp_hrking/hrking_img_setting'
  }).then(res => {

    if (isApiOk(res)) {
      runFn(callback, null, res.data);
    }
  });
}

/**
 * 合并hrking的主存储
 * @param {*} data 
 */
function mergeHrkingStore(data) {

  const key = config.HRKING.mainStoreKey;

  let curr = _getStorageSync(key);
  let finalStore;

  if (curr) {
    finalStore = extend(true, {}, curr, data);
  } else {
    finalStore = data;
  }

  _setStorageSync(key, finalStore);
}

/**
 * String.prototype.repeat
 * @param {*} str 
 * @param {*} n 
 */
function strRepeat(str, n) {

  if (str.repeat) {
    return str.repeat(Math.max(0, n));
  }

  if (n <= 0) {
    return '';
  }

  let dummy = str;
  for (let i = n - 2; i >= 0; --i) {
    str = str + dummy;
  }

  return str;
}

/**
 * requestAnimationFrame兼容
 * @param {*} callback 
 */
function raf(callback) {
  if (typeof requestAnimationFrame !== 'undefined') {
    return requestAnimationFrame;
  } else if (typeof webkitRequestAnimationFrame !== 'undefined') {
    return webkitRequestAnimationFrame;
  } else if (typeof mozRequestAnimationFrame !== 'undefined') {
    return mozRequestAnimationFrame
  } else {
    return function(callback) {
      return setTimeout(callback, 17); //不支持requestAnimationFrame 的补救措施
    };
  }

}

/**
 * cancelAnimationFrame兼容
 * @param {*} id 
 */
function craf(id) {
  if (typeof cancelAnimationFrame !== 'undefined') {
    return cancelAnimationFrame;
  } else if (typeof webkitCancelRequestAnimationFrame !== 'undefined') {
    return webkitCancelRequestAnimationFrame;
  } else if (typeof webkitCancelAnimationFrame !== 'undefined') {
    return webkitCancelAnimationFrame;
  } else if (typeof mozCancelRequestAnimationFrame !== 'undefined') {
    return mozCancelRequestAnimationFrame
  } else if (typeof mozCancelAnimationFrame !== 'undefined') {
    return mozCancelAnimationFrame
  } else {
    return function(id) {
      clearTimeout(id);
    };
  }
}

/**
 * hrking initialize
 */
function hrkingInitApi() {
  return request({
    url: config.apiUrl + '/hr/special/wxapp_hrking/init'
  }).then(res => {
    if (isApiOk(res)) {
      return Promise.resolve(res.data);
    } else {
      return Promise.reject();
    }
  });
}

/**
 * 中途退出
 *      $paper_id = intval($_POST['paper_id']);
        $hrking_id = intval($_POST['hrking_id']);
        $num = intval($_POST['num']);//在第几题的时候放弃挑战，这个题还没有作答
        $competitor_id = intval($_POST['competitor_id']);
 * @param {*} params 
 */
function hrkingOutFightApi(params) {
  return request({
    url: config.apiUrl + '/hr/special/wxapp_hrking/outFight',
    method: 'POST',
    data: params
  }).then(res => {
    if (isApiOk(res)) {
      return Promise.resolve(res.data);
    } else {
      return Promise.reject();
    }
  });
}

/**
 * hrking主存储设置
 * @param {Object} gettedStore 已经获取到的数据, 表示要更新存储
 */
function hrkingSetStore(gettedStore) {

  if (gettedStore) {
    _setStorageSync(config.HRKING.mainStoreKey, gettedStore);
    return Promise.resolve(gettedStore);
  }

  let storage = _getStorageSync(config.HRKING.mainStoreKey);

  if (storage) {
    return Promise.resolve(storage);
  } else {
    return hrkingInitApi().then(data => {
      _setStorageSync(config.HRKING.mainStoreKey, data);
      return Promise.resolve(data);
    });
  }
}

function hrkingGetStore() {
  return _getStorageSync(config.HRKING.mainStoreKey) || {};
}

/**
 * 考题共计5道，每道题答题时间10秒，前4题每题答对得10分，3秒内完成答题则得15分，最后一道题答对得20分，3秒完成答题则得40分，答错及未答则无分，满分100分。比拼结束后，对战结果自动计入至对战双方各自的战绩中（对战次数、战胜次数、名次）

 * 计算分数
 * @param {*} usedMs 使用了多少毫秒
 * @param {*} seq 第几道题目, 从1开始
 */
function hrkingCalcScore(usedMs, seq) {

  let isLast = seq === 5;
  let score = 0;

  // 3s内
  if (usedMs <= 3000) {

    if (!isLast) {
      score = 15;
    } else {
      score = 40;
    }

  } else {
    if (!isLast) {
      score = 10;
    } else {
      score = 20;
    }
  }

  return score;
}

/**
 * 获取玩家明片
 * @param {*} hrking_id 
 */
function hrkingGetPlayerCard(hrking_id) {
  if (!hrking_id) {
    console.error('参数不全');
    return;
  }

  return request({
    url: config.apiUrl + '/hr/special/wxapp_hrking/getPlayerCard',
    // method: 'POST',
    data: {
      hrking_id: hrking_id
    }
  });
}

/**
 * 创建房间
 */
function hrkingCreateRoom(hrking_id) {
  return request({
    url: config.apiUrl + '/hr/special/wxapp_hrking/createRoom',
    method: 'POST',
    data: {
      hrking_id: hrking_id
    }
  });
}

/**
 * 进入房间
 */
function hrkingIntoRoom(hrking_id, roomId = -1) {
  return request({
    url: config.apiUrl + '/hr/special/wxapp_hrking/intoRoom',
    method: 'POST',
    data: {
      hrking_id: hrking_id,
      roomId: roomId
    }
  });

  // .then(res => {
  //   if (!isApiOk(res)) {
  //     return Promise.reject(res);
  //   }

  //   return Promise.resolve(res.data);
  // });
}

/**
 * 
 * @param {*} hrking_id 
 * @param {*} is_pvp_left 是否有一人退出
 */
function hrkingGetRoomId(hrking_id, is_pvp_left = 1) {
  return request({
    url: config.apiUrl + '/hr/special/wxapp_hrking/getRoomId',
    data: {
      creater: hrking_id,
      is_pvp_left: is_pvp_left
    }
  });
}

/**
 * 查看房间状态 1 是发起者已经离开房间  2是房间已满
 * @param {*} roomId 
 */
function hrkingRoomStatus(roomId, hrking_id) {
  return request({
      url: config.apiUrl + '/hr/special/wxapp_hrking/roomStatus',
      method: 'POST',
      data: {
        roomId: roomId,
        hrking_id: hrking_id
      }
    })

    .then(res => {
      // return isApiOk(res) ? Promise.resolve(res.data) : Promise.reject()
      if (!isApiOk(res)) {
        return Promise.reject(res);
      }

      // 1 是发起者已经离开房间  2是房间已满
      return Promise.resolve(res.data);
    });
}

/**
 * 
 * @param {*} time 毫秒值
 */
function promisifyTime(time, asyncFn) {

  time = time || 300;
  return new Promise((resolve, reject) => {
    asyncFn();
    setTimeout(function() {
      resolve();
    }, time);
  });
}

/**
 * // https://www.zhihu.com/question/265282668
   // 微信小程序动画不能检测执行结束, 我也是无语了, tx还能再神经一点吗?
   // 所以将一系列将要线性执行的动画串联起来
 * @param {*} animations 
 * animations形式如下: [obj]
 * 其中obj为:
 * {
 *    time: 1000, // 动画时长,
 *    action: function() {}, 实际动画执行函数
 * }
 */
function seqAni(animations, callback) {

  if (!animations || !animations.length) {
    return;
  }

  let aniQueue = [],
    i, len;

  for (i = 0, len = animations.length; i < len; ++i) {
    let tmp = animations[i];
    aniQueue.push(promisifyTime(tmp.time, tmp.action));
  }

  return seqExexPromises(aniQueue);
}

/**
 * 顺序执行多个promise
 * @param {*} promises 
 */
function seqExexPromises(promises) {
  let t = Promise.resolve();

  if (promises && promises.length) {
    t = promises.shift();
    t = t.then(() => {
      return seqExexPromises(promises);
    });
  }

  return t;
}

/**
 * 从storage中获取wx原始用户信息
 */
function getRawUser() {
  let rawData = _getStorageSync(config.userinfoRawDataKey);

  if (rawData) {
    return JSON.parse(_getStorageSync(config.userinfoRawDataKey));
  } {
    return false;
  }
}

/**
 * 设置wx原始用户信息到storage中
 */
function setRawUser(rawData) {
  _setStorageSync(config.userinfoRawDataKey, rawData);
}

/**
 * 获取登录页面配置图片
 */
function getAuthImgSettingApi() {

  // https://zhaopin.hrloo.com/hr/special/wxapp/page_setting
  return request({
    url: config.apiUrl + '/hr/special/wxapp/auth_page_setting',
    data: {},
    withLocation: false,
  }).then(res => {
    console.log(res);

    if (!res || res.result != 0) {
      return Promise.resolve(false);
    }
    return Promise.resolve(res.data);
  });
}

/**
 * 解密wx小程序的加密数据
 * @param {*} sessionKey 
 * @param {*} encryptedData 
 */
function decryptData(sessionKey, encryptedData) {

  let data = {};

  return request({
    url: config.apiUrl + '/hr/special/wxapp/init',
    withSessionKey: true
  }).then(res => {
    return Promise.resolve(res.result == 0 ? res.data : false);
  }).catch(err => {
    return Promise.resolve(false);
  });
}

/**
 * 自动注册
 * @param {*} encryptedData 授权获取手机号后的加密数据, 包含iv + encryptedData
 */
function autoRegister(encryptedData) {

  return request({
    url: config.apiUrl + '/hr/special/wxapp/autoRegister',
    method: 'POST',
    withSessionKey: true,
    data: encryptedData
  }).then(res => {
    return Promise.resolve(res.result == 0 ? res.data || true : false);
  }).catch(err => {
    return Promise.resolve(false);
  });
}

/**
 * 设置企业信息
 * 
 * data = { company: '' }
 */
function setCompany(data) {
  return request({
    url: config.apiUrl + '/hr/uc/user/setCompany',
    method: 'POST',
    withSessionKey: true,
    data: data
  }).then(res => {
    return Promise.resolve(res.result == 0 ? res.data || true : false);
  }).catch(err => {
    return Promise.resolve(false);
  });
}

function registerSuccessTip() {
  let duration = 1000;

  return showToast({
    title: '登录成功',
    icon: 'success',
    duration: duration
  }).then(() => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        hideLoading(true);
        resolve();
      }, duration);
    });
  });
}
/**函数的去抖动**/
function debounce(method, delay) {
  let timer = null
  let _delay = delay ? delay : 500
  return function() {
    let context = this,
      args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function() {
      method.apply(context, args);
      // console.info(method, context, args)
    }, _delay)
  }
}
/**函数节流**/
function throttle(method, duration) {
  let begin = new Date();
  let _duration = duration ? duration : 500
  return function() {
    let context = this,
      args = arguments,
      current = new Date();
    if (current - begin >= _duration) {
      method.apply(context, args);
      begin = current;
    }
  }
}
function _throttle(fn, gapTime) {
  if (gapTime == null || gapTime == undefined) {
    gapTime = 500
  }

  let _lastTime = null

  // 返回新的函数
  return function () {
    let _nowTime = + new Date()
    if (_nowTime - _lastTime > gapTime || !_lastTime) {
      fn.apply(this, arguments)   //将this和参数传给原函数
      _lastTime = _nowTime
    }
  }
}
//收集用户的formid
function _switchFormSubmit(formId) {
  request({
    url: config.apiUrl + '/hr/hrzp/share/collect_from_id',
    data: {
      'form_id': formId
    },
    method: "POST",
    withSessionKey: true
  }).then(res => {});
}
//判断用户是否授权
function IsGetAuthinfo() {

  let _authinfo = _getStorageSync('authinfo');
  let _url = config.authorizationURL //通用授权页面

  if (!_authinfo) {

    let pages = getCurrentPages() //获取加载的页面
    let currentPage = pages[pages.length - 1] //获取当前页面的对象
    let url = currentPage.route //当前页面url
    let options = currentPage.options //如果要获取url中所带的参数可以查看options

    //把源页面的参数带到 授权跳转的页面 [包括源页面的url地址]
    _url = addParam2url(_url, options)
    _url = addParam2url(_url, 'backpath', url)
    //没有授权过 跳转通用授权页
    setTimeout(function () {
      gotoPage({
        url: _url,
        openType: 'reLaunch'
      })

    },200)
    return false
  }
  return true
}
//储存操作记录
function setOperationRecord(v) {

  let localData = JSON.parse(_getStorageSync('operationRecord'))
  let isBE = false
  let _k = 0
  //如果有了 operationRecord
  if (localData) {
    for (let k in localData) {
      if (localData[k] == v) {
        isBE = true 
      }
      _k = Number(k)
    }
    if (!isBE){
      let __k = _k+1
      var _v = '{"' + __k + '":"' + v + '"}'
      //如果不存在 就存起来
      var obj = Object.assign(localData, JSON.parse(_v))
      _setStorageSync('operationRecord', JSON.stringify(obj))
    }
  } else {
    var v = '{"0":"' + v + '"}'
    _setStorageSync('operationRecord', v)
  }
}
//操作记录是否存在
function getOperationRecord(v) {
  let localData = JSON.parse(_getStorageSync('operationRecord'))
  for (let k in localData) {
    if (localData[k] == v) {
      return true
    }
  }
  return false
}
//基础库兼容函数
function compareVersion(v1, v2) {
  v1 = v1.split('.')
  v2 = v2.split('.')
  var len = Math.max(v1.length, v2.length)

  while (v1.length < len) {
    v1.push('0')
  }
  while (v2.length < len) {
    v2.push('0')
  }

  for (var i = 0; i < len; i++) {
    var num1 = parseInt(v1[i])
    var num2 = parseInt(v2[i])

    if (num1 > num2) {
      return 1
    } else if (num1 < num2) {
      return -1
    }
  }

  return 0
}

module.exports = {
  Promise: Promise,
  runFn: runFn,
  type: type,
  trim: trim,
  isPlainObject: isPlainObject,
  isUndef: isUndef,
  isFunction: isFunction,
  isEmptyObject: isEmptyObject,
  isArray: isArray,

  // merge: merge
  // deepClone: deepClone
  extend: extend,
  len: len,
  log: log,
  hijackLogMethods: hijackLogMethods,
  checkInput: checkInput,
  addParam2url: addParam2url,
  parseUrl: parseUrl,
  promisify: promisify,
  parseContent: parseContent,
  parseMoreLine: parseMoreLine,
  _formatThemes: _formatThemes,
  request: request,
  // verifyCaptcha: verifyCaptcha, // 暂时不用
  _getSessionKeyByApi: _getSessionKeyByApi,
  _getCode: _getCode,
  updateSessionKeyApi: updateSessionKeyApi,
  isHRSelf: isHRSelf,
  halfStringLen: halfStringLen,
  fullStringLen: fullStringLen,
  subString: subString,
  chooseImage: chooseImage,
  guid: guid,
  _getStorageSync: _getStorageSync,
  _setStorageSync: _setStorageSync,
  saveSceneApi: saveSceneApi,
  getSharePathByScene: getSharePathByScene,
  throwError: throwError,
  handleErrApi: handleErrApi,
  gotoPage: gotoPage,
  delDynFromDL: delDynFromDL,
  reportApi: reportApi,
  dynamicPraise: dynamicPraise,
  commentPraise: commentPraise,
  wrapDataKey: wrapDataKey,
  wrapStr: wrapStr,
  getSystemInfoSync: getSystemInfoSync,
  showToast: showToast,
  hideToast: hideToast,
  showLoading: showLoading,
  hideLoading: hideLoading,
  showModal: showModal,
  uploadFiles: uploadFiles,
  uploadSink: uploadSink,
  setPreviewFlag: setPreviewFlag,
  clearPreviewFlag: clearPreviewFlag,
  isPreviewed: isPreviewed,
  previewImage: previewImage,
  praiseDL: praiseDL,
  getDLComment: getDLComment,
  praiseDLComment: praiseDLComment,
  addComment2dl: addComment2dl,
  isLoginAndIsBindSanMao: isLoginAndIsBindSanMao,
  isBindSanMao: isBindSanMao,
  isLoginWS: isLoginWS,
  isLogin: isLogin,
  checkBindApi: checkBindApi,
  wxGetUserInfo: wxGetUserInfo,
  hasAuthGeo: hasAuthGeo,
  openSetting: openSetting,
  wxGetLocation: wxGetLocation,
  getUserInfoSanMaoApi: getUserInfoSanMaoApi,
  groupProp: groupProp,
  getRect: getRect,
  random: random,
  randomEle: randomEle,
  extractPartial: extractPartial,
  getTouchPosition: getTouchPosition,
  getBGAudioState: getBGAudioState,
  wxStopPullDownRefresh: wxStopPullDownRefresh,
  wxStopRecord: wxStopRecord,
  autoLogin: autoLogin,
  canPlayVideo: canPlayVideo,
  parseWXUserInfoRes: parseWXUserInfoRes,
  // wxSaveImageToPhotosAlbum: wxSaveImageToPhotosAlbum,
  delay: delay,
  groupArray: groupArray,
  subApi: subApi,
  prepay: prepay,
  wxRequestPayment: wxRequestPayment,
  fixCommentData: fixCommentData,
  wxPageScrollTo: wxPageScrollTo,
  unixTimestamp: unixTimestamp,
  saveTemplateMessage: saveTemplateMessage,
  sanMaoUserInfo: sanMaoUserInfo,
  delaySync: delaySync,
  fixShare: fixShare,
  logicCount: logicCount,
  saveVideoPlayEndTime: saveVideoPlayEndTime,
  fixArticleHtml: fixArticleHtml,
  throttle: throttle,
  removeLastN: removeLastN,
  wxCreateAni: wxCreateAni,
  isApiOk: isApiOk,
  hrkingGetImgSetting: hrkingGetImgSetting,
  mergeHrkingStore: mergeHrkingStore,
  strRepeat: strRepeat,

  raf: raf,
  craf: craf,

  // hrking
  hrkingInitApi: hrkingInitApi,
  hrkingSetStore: hrkingSetStore,
  hrkingGetStore: hrkingGetStore,
  hrkingCalcScore: hrkingCalcScore,
  hrkingOutFightApi: hrkingOutFightApi,
  hrkingGetPlayerCard: hrkingGetPlayerCard,
  hrkingCreateRoom: hrkingCreateRoom,
  hrkingIntoRoom: hrkingIntoRoom,
  hrkingGetRoomId: hrkingGetRoomId,
  hrkingRoomStatus: hrkingRoomStatus,

  // animation
  promisifyTime: promisifyTime,
  seqAni: seqAni,

  getRawUser: getRawUser,
  setRawUser: setRawUser,
  getAuthImgSettingApi: getAuthImgSettingApi,
  decryptData: decryptData,
  autoRegister: autoRegister,
  setCompany: setCompany,
  registerSuccessTip: registerSuccessTip,

  //function
  debounce: debounce,
  throttle: throttle,
  _throttle: _throttle,
  _switchFormSubmit: _switchFormSubmit,
  IsGetAuthinfo: IsGetAuthinfo,
  setOperationRecord: setOperationRecord,
  getOperationRecord: getOperationRecord,

  compareVersion: compareVersion
};