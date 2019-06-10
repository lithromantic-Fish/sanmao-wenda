// pages/login/login.js
let util = require('../../utils/util');
let config = require('../../config');
//获取应用实例
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    PAGE: true,
    pageOptions: {},
    TIP: {
      state: false,
      text: ''
    },
    time: '',
    mobile: '',
    imgCode: {
      url: '',
      code: ''
    },
    msgCode: {
      code: '',
      text: '点击获取',
      state: '',
      time: 120
    },
    username: '',
    password: '',
    LoginWay: {
      text: '手机号 + 验证码',
      isShow:false,
      type: 0,
      list: [
        {
          text: '手机号 + 验证码',
          selected: true
        },
        {
          text: '手机号 + 密码',
          selected: false
        },
        {
          text: '学号 + 密码',
          selected: false
        },
        {
          text: '邮箱 + 密码',
          selected: false
        },
      ]
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    // console.info(options)
    let self = this

    self.setData({
      pageOptions: options
    })

    //生成sessionkey
    util._getCode().then(res => {
      util._getSessionKeyByApi(res)
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function(options) {
    let self = this

    //生成图片验证码
    // self._getImageCode()
    const captchaResult = app.captchaResult;
    app.captchaResult = null; // 验证码的票据为一次性票据，取完需要置空
    if (captchaResult && captchaResult.ret === 0) {
      // 将验证码的结果返回至服务端校验
      const ticket = captchaResult.ticket;
      const randstr = captchaResult.randstr;
      console.info(ticket, randstr)
      let opts = {
        ticket: ticket,
        randstr: randstr
      }
      self._getMsgCode(opts)
    }
  },

  /**
   * 输入手机号码
   */
  _interMobile: function(e) {
    let self = this
    let mobile = util.trim(e.detail.value)

    self.setData({
      mobile: mobile
    })
  },
  /**
   * 图形验证码输入
  */
  _interImgCode: function(e) {
    let self = this
    let imageCode = util.trim(e.detail.value)

    self.setData({
      ['imgCode.code']: imageCode
    })
  },
  /**
   * 短信验证码输入
  */
  _interMsgCode: function (e) {
    let self = this
    let msgCode = util.trim(e.detail.value)

    self.setData({
      ['msgCode.code']: msgCode
    })
  },
  /**
   * 手机号登录/学号登录/邮箱登录 -> 
  */
  _interLoginUsername: function (e) {
    let self = this
    let username = util.trim(e.detail.value)

    self.setData({
      ['username']: username
    })
  },
  /**
   * 手机号登录/学号登录/邮箱登录 -> 
  */
  _interPassword: function (e) {
    let self = this
    let pw = util.trim(e.detail.value)

    self.setData({
      ['password']: pw
    })
  },
  /**
   * 图像验证码
   **/
  _getImageCode: function() {
    let self = this
    let time = +new Date() + util.guid();

    this.setData({
      time: time
    });

    let url = config.apiUrl + '/hrloo56.php?m=api&c=index&a=verifycode&time=' + time
    self.setData({
      ['imgCode.url']: url
    })
  },

  /**
   * 发送短信验证码倒计时
   **/
  _setTime :function () {
    let self = this
    let timer = null
    if (self.data.msgCode.time == 0) {
      clearTimeout(timer)
      self.setData({        
        ['msgCode.text']: '重新获取',
        ['msgCode.state']: '',        
        ['msgCode.time']: 120
      })
    } else {
      let _time = --self.data.msgCode.time
      self.setData({
        ['msgCode.text']: _time + 's',
        ['msgCode.state']: 1,
        ['msgCode.time']: _time
      })
      timer = setTimeout(function() {
        self._setTime()
      }, 1000)
    }

  },
  /**
   * 获取短信验证码
   */
  _getMsgCode: function(opts) {

    let self = this

    wx.showLoading({
      title: '',
      mask: true
    })

    util.request({
      url: config.apiUrl + '/hrloo.php?m=api&c=index&a=ajax_send_verify_msg_tx',
      data: {
        mobile: self.data.mobile,
        ticket: opts.ticket,
        randstr: opts.randstr
      },
      method: "POST",
      withSessionKey: true
    }).then(res => {
      let data = res.data
      if (res.result === 0) {
        self._setTime()
        self.setData({})
      } else {
        self._showTips({
          text: res.msg
        })
      }

    })
  },
  /**
   * 验证腾讯验证码
  */
  toTCaptcha: function () {

    let self = this

    if (self.data.msgCode.state == 1) {
      return
    }

    if (self.data.mobile == '') {
      self._showTips({
        text: '请输入正确手机号码'
      })
      return
    }

    // if (self.data.imgCode.code == '') {
    //   self._showTips({
    //     text: '请输入图形验证码'
    //   })
    //   return
    // }

    if (self.data.msgCode.state == 1) {
      self._showTips({
        text: self.data.msgCode.time + 's后重新获取'
      })
      return
    }


    wx.navigateToMiniProgram({
      appId: 'wx5a3a7366fd07e119',
      path: '/pages/captcha/index',
      // envVersion: 'release',
      extraData: {
        appId: '2043413561'//你申请的验证码的appId
      }
    })
  },
  /**
   * 登录
  */
  _Login: function(){

    let self = this
    let _type = self.data.LoginWay.type
    let postData = {}

    if (_type == 0) { // 短信验证码 注册/登录
      if (self.data.mobile == '') {
        self._showTips({
          text: '请输入正确手机号码'
        })
        return
      }
      // if (self.data.imgCode.code == '') {
      //   self._showTips({
      //     text: '请输入图形验证码'
      //   })
      //   return
      // }
      if (self.data.msgCode.code == '') {
        self._showTips({
          text: '请输入短信验证码'
        })
        return
      }
      postData = {
        time: self.data.time,
        mobile: self.data.mobile,
        // graphcode: self.data.imgCode.code,
        verifycode: self.data.msgCode.code,
        login_tp: 2
      }
    } else { //手机+密码/学号+密码/邮箱+密码 登录

      if (!self.data.username) {
        let _text = ''
        switch (parseInt(_type)) {
          case 1:
            _text = '请输入您的手机号码'
            break;
          case 2:
            _text = '请输入您的三茅学号'
            break;
          case 3:
            _text = '请输入您的邮箱账号'
            break;
        }
        self._showTips({
          text: _text
        })
        return
      }

      if (!self.data.password) {
        self._showTips({
          text: '请输入账号密码'
        })
        return
      }

      postData = {
        username: self.data.username,
        password: self.data.password,
        login_tp: 1
      }
    }

    wx.showLoading({
      title: '',
      mask: true
    })

    util.request({
      url: config.apiUrl + '/hr/special/wxapp/login',
      data: postData,
      method: "POST",
      withSessionKey: true
    }).then(res => {
      let data = res.data
      if (res.result === 0) {

        util._setStorageSync('isLogin', 1);
        util._setStorageSync('sessionKey', data.session_key);

        util.showToast({
          title: '登录成功',
          duration: 1500
        })
        setTimeout(function () {
          wx.navigateBack()
        }, 1500);
        
        let pages = getCurrentPages(); // 获取页面栈
        let currPage = pages[pages.length - 1]; // 当前页面
        let prevPage = pages[pages.length - 2]; // 上一个页面
        prevPage.setData({
          prevPageData: { loginState: true }
        })

      } else if (res.result === 2) {
        //账号不存在 去注册
        setTimeout(function () {
          util.runFn(self._Register)
        },300)
      } else if (res.result === 3) {
        self._showTips({
          text: '图形验证码输入有误'
        })
      } else {
        self._showTips({
          text: res.msg
        })
      }

    })
  },
  /**
   * 注册
  */
  _Register: function () {

    let self = this

    wx.showLoading({
      mask: true
    })

    util.request({
      url: config.apiUrl + '/hr/special/wxapp/wx_register',
      data: {
        time: self.data.time,
        mobile: self.data.mobile,
        graphcode: self.data.imgCode.code,
        verifycode: self.data.msgCode.code,
        login_tp: 2
      },
      method: "POST",
      withSessionKey: true
    }).then(res => {

      let data = res.data
      if (res.result === 0) {
        
        util._setStorageSync('isLogin', 1);

        let pages = getCurrentPages(); // 获取页面栈
        let currPage = pages[pages.length - 1]; // 当前页面
        let prevPage = pages[pages.length - 2]; // 上一个页面
        prevPage.setData({
          prevPageData: { loginState: true }
        })

        util.showToast({
          title: '注册/登录成功',
          duration: 1500
        })
        setTimeout(function () {
          wx.navigateBack()
        }, 1500);
      } else {
        self._showTips({
          text: res.msg
        })
      }

    })
  },
  /**
   * 注册登录提示
   **/
  _showTips: function(opts) {
    let self = this
    let delay = opts.delay || 2000
    let _timer = null

    clearTimeout(_timer)
    self.setData({
      ['TIP.state']: !self.data.TIP.state,
      ['TIP.text']: opts.text ? opts.text : '',
    })
    _timer = setTimeout(function() {
      self.setData({
        ['TIP.state']: !self.data.TIP.state,
        ['TIP.text']: '',
      })
    }, delay)
  },
  /**
   * 显示 登录方式 选择框
  */
  _showLoginWays: function(e){
    let self = this
    self.setData({
      ['LoginWay.isShow']: !self.data.LoginWay.isShow
    })
  },
  /**
   * 选择类型
  */
  _selectLoginWay: function(e){
    let self = this
    let data = e.currentTarget.dataset
    let data2 = self.data.LoginWay.list

    self.setData({
      ['LoginWay.isShow']: !self.data.LoginWay.isShow,
      ['LoginWay.type']: data.login_type
    })

    self.setData({
      ['LoginWay.text']: self.data.LoginWay.list[data.login_type].text
    })
    
    for (let i = 0; i < data2.length; i++) {
      let obj = 'LoginWay.list[' + i + '].selected'
      let val = null
      if (i == data.login_type) {
        val = true
      } else {
        val = false
      }
      self.setData({
        [obj]: val
      })
    }

  },
  _hideLoginWay: function(e){
    let self = this
    console.info(e)
    return
    if (self.data.LoginWay.isShow) {
      console.info('in')
      self.setData({
        ['LoginWay.isShow']: false
      })
    }
  }
})