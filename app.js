//app.js
let util = require('./utils/util');
let config = require('./config');
let Promise = util.Promise;

let topics = {}; // 回调函数存放的数组

App({
  onLaunch: function (options) {
    let self = this;

    let path = options.path; // 打开小程序的页面, 如pages/index/index
    let scene = options.scene; // 打开小程序的场景值

    let systemInfo = util.getSystemInfoSync();
    this.GD.systemInfo = systemInfo;

    //新版本发布后的更新提示 如果基础库 低于1.9.9 不提示
    if (util.compareVersion(systemInfo.SDKVersion, '1.9.9') == 1) {
      const updateManager = wx.getUpdateManager()

      updateManager.onCheckForUpdate(function (res) {
        // 请求完新版本信息的回调
        console.log('res.hasUpdate', res.hasUpdate)
      })
      
      updateManager.onUpdateReady(function () {
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          success: function (res) {
            if (res.confirm) {
              // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
              updateManager.applyUpdate()
            }
          }
        })
      })

      updateManager.onUpdateFailed(function () {
        // 新版本下载失败
        wx.showModal({
          title: '新版本下载失败',
          content: '请检查网络是否稳定等,关闭小程序后重启小程序重试！',
          success: function (res) {},
          showCancel: false
        })
      })
    }
  },
  onReady: function(){
    wx.getSystemInfo({
      success: function (res) {
        self.GD.systemInfo = res

      },
    })
  },
  onShow(options) {
    let self = this
    let path = options.path; // 打开小程序的页面, 如pages/index/index
    let scene = options.scene; // 打开小程序的场景值

    // console.info(self.GD.systemInfo.statusBarHeight)
    // console.info(self.GD.systemInfo.pixelRatio)
    // console.info(self.GD.systemInfo.statusBarHeight * self.GD.systemInfo.pixelRatio)

    //生成sessionkey
    util._getCode().then(res => {
      util._getSessionKeyByApi(res)
    })

    // 腾讯验证码 解决各类回调的兼容问题
    if (!this.captchaTicketExpire) this.captchaTicketExpire = {};

    if (options.scene === 1038 && options.referrerInfo.appId === 'wx5a3a7366fd07e119') {
      const result = options.referrerInfo.extraData;
      if (result && result.ret === 0) {
        const ticket = result.ticket;
        if (!this.captchaTicketExpire[ticket]) {
          this.captchaResult = result;
          this.captchaTicketExpire[ticket] = true;
        }
      } else {
        // 用户关闭了验证码
      }
    }

  },

  // 应用全局数据, global data
  GD: {
    // 授权成功后的数据, 包含用户信息
    authinfo: null,

    getCodeErrLimit: 1, // 获取code错误超过指定次数报错(和wx.login有关)
    getCodeErrCount: 0, // 获取code错误次数

    //wsReConnectCnt: 0, // ws重连次数统计

    // 是否获取过 ''获取用户信息' 的权限
    getAuthGetUserInfo: false,

    // 是否获取过 '保存图片到相册' 的权限
    getAuthSaveImageToPhotosAlbum: false,

    systemInfo: null, // 系统信息
    systemInfoSync: null, // 系统信息

    getSystemInfoCnt: 0, // 获取系统信息次数
    getSystemInfoMax: 3, // 获取系统信息最大次数

    //txCloudVideoId: '', // 腾讯云视频id(在视频列表页做缓存用)

    // 是否开启全局调试模式, 这个会在个人中心页面启用禁用
    debugMode: true,

    // 解密得到的手机号
    phoneNumber: '',
  },
  /**
   * 将wx的api promise化, 避免回调的写法
   * @param {function} wxApi 小程序中的api名, 如wx.request
   * @param {object} options  wxApi对应的配置项列表, 实际调用时传入
   * @param {object} defaults 默认的参数对象, **限内部使用**
   */
  promisify: function(wxApi, options = {}, defaults = {}) {
    return util.promisify(wxApi, options, defaults);
  },

  /**
   * wx.request封装
   * 如果是微信的api, 这里的结果会多一层, 类似下面这样
   */
  request: function(options) {
    return util.request(options);
  },

  /**
   * 跳转页面方法封装, 本项目中跳转太多了, 统一处理下
   * 主要是为了应对页面栈大小超过5的情况, 在catch中处理
   * 跳转的api多数为只有一个参数url, 其他为回调
   */
  gotoPage: function(options) {
    return util.gotoPage(options);
  },

  wxGetUserInfo(options) {

    let defaults = {
      success: util.noop,
      // onReject: util.noop, // 拒绝授权
    };
    options = util.extend({}, defaults, options);

    let self = this;
    let authInfoStore = util._getStorageSync('authInfo');

    if (authInfoStore) {
      let parsedRes = util.parseWXUserInfoRes(authInfoStore);
      return Promise.resolve(parsedRes);
    }

    return util.promisify(wx.getUserInfo, {
      lang: 'zh_CN'
    })
      .then(res => {
        console.log('wxGetUserInfo(), success', res);
        util._setStorageSync('authInfo', res);

        util.runFn(options.success, null, res);

        // 这里要继续往下传, 不然在外部中取不到
        return Promise.resolve(util.parseWXUserInfoRes(res));
      })
      .catch(err => {
        if (!self.GD.getAuthGetUserInfo) {
          self.GD.getAuthGetUserInfo = true;

          console.warn('用户拒绝获取个人信息', err);
          util._setStorageSync('authInfo', '');
          return Promise.reject(err);
        }

        return util.openSetting().then(res => {
          // 用户同意获取个人信息, 再获取, 必定成功, 进入到then里
          if (res.userInfo) {
            return self.wxGetUserInfo();
          } else {
            return Promise.reject(err);
          }
        }).catch(err => {
          return Promise.reject(err);
        });
      });
  },
  /**
   * 触发事件
   */
  trigger: function(topic, args) {

    if (!topics[topic]) {
      return false;
    }

    setTimeout(function() {
      var subscribers = topics[topic],
        len = subscribers ? subscribers.length : 0;

      while (len--) {
        subscribers[len].func(topic, args);
      }
    }, 0);

    return true;
  },
  /**
   * 自定义弹窗获取用户信息
   * 也就是<button open-type="getUserInfo"></button>
   * @param {*} options 
   */
  wxGetUserInfoByButton(options) {
    // 如果缓存命中, 回调
    let rawUser = util.getRawUser();
    if (rawUser) {
      return util.runFn(options.success, null, rawUser);
    }
  },
  noPaymentTip(){
    let options = util._getStorageSync('unpaidOrder')
    //订单未支付提醒
    if (options) {
      wx.showModal({
        title: '确定放弃支付吗？',
        content: '活动结束马上恢复原价，现在购买最优惠哦~',
        cancelText: '暂时放弃',
        cancelColor: '#cccccc',
        confirmText: '继续支付',
        confirmColor: '#0092ff',
        success: function(res){
          if (res.confirm) {
            util.gotoPage({
              url: util.addParam2url('/pages/pay/pay', options)
            })
          } else {
            util._setStorageSync('unpaidOrder', '')
          }
        },
        fail: function(res){
          console.info(res)
          util._setStorageSync('unpaidOrder','')
        }
      })
    }
  }
})