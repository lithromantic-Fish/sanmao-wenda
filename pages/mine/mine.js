
let util = require('../../utils/util');
let config = require('../../config');
//获取应用实例
const app = getApp()

// pages/mine/mine.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    PAGE : false,
    msgCount:'',
    startCout:'',
    questCount:'',
    isLogin: false,
    // pageOptions: {},
    // system: 0,
    // ABOUT: false,
    // isLogin: false,
    // loginData: {},
    // // type (1 班级 , 2 考题 , 3成绩)  id 对应的班级id,试题id ,当是成绩的时候id 是做的那套题的id 
    // shareData: {
    //   path: '',
    //   image: ''
    // },

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    
    let self = this
    
    self.setData({
      pageOptions: options
    })

    util.runFn(self._getShareImage)

    wx.setNavigationBarTitle({
      title: '个人中心',
    })
    let sys = app.GD.systemInfo.system
    if (sys.indexOf('Android') > -1) {
      self.setData({
        system: 1
      })
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {    
    let self = this

    //如果基础库 低于2.0.7 不显示 其他小程序跳转
    if (util.compareVersion(app.GD.systemInfo.SDKVersion, '2.0.7') == 1) {
      self.setData({
        ABOUT: !self.data.ABOUT
      })
    }
  },



  //获取个人中心信息
  getMineInfo() {
    util.request({
      url: config.apiUrl + '/hr/group/question/mine',
      method: "POST",
      withSessionKey: true,
    }).then(res => {
      console.log('res', res)
      this.setData({
        msgCount:res.data.msgCount,
        startCout: res.data.startCout,
        questCount: res.data.questCount
      })
    }).catch(err => {

    })
  },


  //拉起手机授权
  _getPhoneNumber: function (res) {
    console.log(res.detail.encryptedData)
    console.log(res.detail.iv)
    let data = res.detail
    if (data.encryptedData && data.iv) {
      this._confirmEvent(data)


    } else {
      util.gotoPage({
        url: '/pages/login/login'
      })
    }

  },
  /**
   * 获取手机号码回调
   */
  _confirmEvent: function (opts) {
    console.log(opts)
    let self = this
    let data = {}

    if (opts.currentTarget) {
      data = arguments[0].detail.getPhoneNumberData
    } else {
      data = opts
    }
    // console.info('opts', opts)

    util.request({
      url: config.apiUrl + '/hr/special/wxapp/autoRegister',
      data: data,
      method: "POST",
      withSessionKey: true
    }).then(res => {

      if (res.result == 0) {
        util._setStorageSync('isLogin', 1)
        self.setData({
          ['isLogin']: true
        })

        util.runFn(self.getInitData)
      } else {
        wx.showToast({
          title: res.msg,
          icon: 'none'
        })
      }

    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    let self = this
    util.runFn(self.getInitData)
    this.setData({
      isLogin: util._getStorageSync('isLogin') == 1 ? true : false
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    let self = this
    return {
      title: '',
      path: self.data.shareData.path ? self.data.shareData.path : '',
      imageUrl: self.data.shareData.image ? self.data.shareData.image : '',
      success: function (res) {
        // 转发成功
        console.log("转发成功");
      },
      fail: function (res) {
        // 转发失败
        console.log("转发失败");
      }
    }
  },
  /**
   * 获取页面数据 
   */
  getInitData: function(){
    let self = this

    wx.showLoading({
      mask: true
    })

    util.request({
      url: config.apiUrl + '/hr/group/question/mine',
      data: {},
      method: "POST",
      withSessionKey: true
    }).then(res => {
      let data = res.data

      self.setData({
        ['PAGE']: true,
      })

      if (res.result === 0) {
        self.setData({
          ['isLogin']: true,
          ['loginData']: res.data,
        })
        
      } else if (res.result === 100){
          self.setData({
            ['isLogin']:false
          })
      }

    })
  },
  _getShareImage: function () {

    let self = this

    let postData = {
      // type: 1,
      // id: self.data.pageOptions.classid,
      // classid: self.data.pageOptions.classid,
    }

    util.request({
      url: config.apiUrl + '/hr/class/class_wxapp/shareImg',
      data: postData,
      method: "POST",
      withSessionKey: true
    }).then(res => {
      if (res.result == 0) {
        self.setData({
          ['shareData.title']: '',
          ['shareData.image']: res.data,
          ['shareData.path']: '/pages/index/index'
        })
      } else {
        wx.showToast({
          title: res.msg,
          icon: 'none'
        })
      }
    })
  },
  
  _copy: function (e) {
    let self = this
    let data = e.currentTarget.dataset
    let copydata = ''
    switch (parseInt(data.type)) {
      case 1:
        copydata = self.data.loginData.studentid
        break;
      case 2:
        copydata = self.data.loginData.mobile != '未绑定' ? self.data.loginData.mobile : ''
        break;
      case 3:
        copydata = self.data.loginData.email != '未绑定' ? self.data.loginData.email : ''
        break;
    }

    if (!copydata) return

    wx.setClipboardData({
      data: copydata,
      success: function (res) {
        wx.getClipboardData({
          success: function (res) {
            console.log(res.data) // data
          }
        })
      }
    })
  },

  /**
   * 跳转
  */
  _gotoPage: function(e){
    let self = this
    let opts = e.currentTarget.dataset

    if (!opts.url) return

    util.gotoPage({
      url : opts.url,
      openType: opts.opentype
    })
  },

  /**
   * 跳转其他小程序
  */
  openMiniApp: function(e){
    let self = this
    let data = e.currentTarget.dataset

    wx.navigateToMiniProgram({
      appId: data.appid,
      path: '',
      // envVersion: 'develop',
      success(res) {
        // 打开成功
      },
      fail(res) {
        console.info('fail', res)
      },
      complete(res) {
        console.info('complete', res)
      }
    })
  }

})