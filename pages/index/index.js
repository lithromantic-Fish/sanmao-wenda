// pages/pay/pay.js
let util = require('../../utils/util');
let config = require('../../config');
//获取应用实例
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    PAGE: false,
    pageOptions: {},
    dayDiff: '0',
    isJoin: true,
    pageData: {},
    system: 0,
    page: 1,    //当前页数，默认为1
    pages:null,   //总页数
    isAllPage:false,//是否加载全部页面
    tabs: 1,   //tab标签，1 推荐，2 最热 ，3 待解决
    qaList:[],  //问题列表
    POPUP: {
      type: 1,
      isLogin: false,
      isShow: false,
      optionsData: {}
    },
    TGCD: {
      h: '00',
      m: '00',
      s: '00'
    },
    /** type (1 班级 , 2 考题 , 3成绩)  id 对应的班级id,试题id ,当是成绩的时候id 是做的那套题的id */
    shareData: {
      path: '',
      image: ''
    },
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let self = this
  

    // self.setData({
    //   pageOptions: options,
    //   dayDiff: self._timeFn()
    // })

    // let sys = app.GD.systemInfo.system
    // if (sys.indexOf('Android') > -1) {
    //   self.setData({
    //     system: 1
    //   })
    // }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    
  },  

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function (options) {
    // let self = this
    // if (util._getStorageSync('isLogin') == 1) {
    //   self.setData({
    //     ['POPUP.isLogin']: true
    //   })
    // }
    this.setData({
      PAGE: 'true'
    })
    //先获取首页推荐内容
    this.getIndexData();
    // if (self.data.pageOptions.scene){
    //   util.runFn(self.getClassidBySence)
    // } else {
    //   //获取首页数据
    //   util.runFn(self.getInitData)
    // }

    //订单未支付提醒
    // app.noPaymentTip()
  },
  // 推荐 
  recommend() {
    this.setData({
      tabs: 1,
      page:1
    })
    this.getIndexData();
  },
  // 最热
  hot() {
    this.setData({
      tabs: 2,
      page: 1

    })
    this.getIndexData();
  },
  // 待解决
  unsettled() {
    this.setData({
      tabs: 3,
      page: 1

    })
    this.getIndexData();
  },

  //获取评论列表
  getIndexData: util.debounce(function() {
    wx.showLoading({
      title: '加载中...',
    })

    let that = this
    util.request({
      url: config.apiUrl + '/hr/group/question/questions',
      method: "POST",
      withSessionKey: true,
      data:{
        tab: that.data.tabs,
        page: that.data.page,
      }
    }).then(res => {
      wx.hideLoading()
      let data = res.data.data
      if(res.result==0){
        if (that.data.page>1){
          if(res.data.data){
            that.setData({
              qaList: this.data.qaList.concat(data)
            })
          }
        }else{
          //没有数据
          if(!res.data.data){
            this.setData({
              qaList: [],
              pages: res.data.pages
            })
          }else{
            that.setData({
              qaList: res.data.data,
              pages: res.data.pages
            })
          }
        }
        that.data.qaList.forEach(ele=>{
          ele.isPlay = false //是否播放音频标识
        })
        that.setData({
          qaList : that.data.qaList
        })
        
      }
    })
  },500),




  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    // 下拉刷新，回到第一页
      this.setData({
        page:1
      })
    this.getIndexData();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    let addPage = this.data.page
    if (addPage == this.data.pages){
        wx.showToast({
          title:'已加载全部'
        })
        return
      }
      else{
        addPage = ++addPage
        this.setData({
          page: addPage
        })
      }
        this.getIndexData();
   
  },



























  
  /**
   * 用户分享
   */
  onShareAppMessage: function (res) {
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
  //去搜索页面
  _goToSearch: function () {
    util.gotoPage({
      url: '/pages/search/search'
    })
  },


  /**
   * 倒计时
  */
  _countDown: function () {
    let self = this
    // 戳获取当天23时59分时间戳
    let last = new Date(new Date(new Date().toLocaleDateString()).getTime() + 24 * 60 * 60 * 1000 - 1)

    function countTime() {
      let date = new Date().getTime()
      let now = new Date().getTime()

      let leftTime = last - now; //时间差                              
      let h, m, s, ms

      if (leftTime >= 0) {
        h = Math.floor(leftTime / 1000 / 60 / 60 % 24);
        m = Math.floor(leftTime / 1000 / 60 % 60);
        s = Math.floor(leftTime / 1000 % 60);

        h = (h < 10 ? '0' + h : h + '')
        m = (m < 10 ? '0' + m : m + '')
        s = (s < 10 ? '0' + s : s + '')
      } else {
        console.log('倒计时已截止')
        return
      }
      self.setData({
        ['TGCD.h']: h,
        ['TGCD.m']: m,
        ['TGCD.s']: s
      })
      setTimeout(countTime, 1000);
    }
    countTime()
  },
  //计算距离考试还剩多少天
  _timeFn: function () {

    var dateBegin = new Date(); //获取当前时间
    var dateEnd = new Date('2019/5/18 08:00:00'); //结束时间
    var dateDiff = dateEnd.getTime() - dateBegin.getTime(); //时间差的毫秒数
    var dayDiff = Math.ceil(dateDiff / (24 * 3600 * 1000)); //计算出相差天数
    return dayDiff
  },
  /**
   * 是否加入班级/是否参与考试
   * 获取页面数据 
   */
  getInitData: function () {
    let self = this

    wx.showLoading({
      mask: true
    })

    let id = self.data.pageOptions.id ? self.data.pageOptions.id : util._getStorageSync('localClassid')

    util.request({
      url: config.apiUrl + '/hr/class/class_wxapp/get_class',
      data: {
        id: id
      },
      method: "POST",
      withSessionKey: true
    }).then(res => {
      let data = res.data

      self.setData({
        ['PAGE']: true,
      })
      if (res.result === 0 && util.isPlainObject(data.classInfo)) {
        self.setData({
          ['isJoin']: false,
          ['pageData']: data
        })
        //获取分享数据
        util.runFn(self._getShareImage)

        if (self.data.pageData.cats) {
          for (let i = 0; i < self.data.pageData.cats.length; i++) {
            let obj = 'pageData.cats[' + i + '].isShowFull'
            let val = null
            if (i == 0) {
              val = true
            } else {
              val = false
            }
            self.setData({
              [obj]: val
            })
          }
        }

      } else {
        self.setData({
          ['isJoin']: true
        })
        // util.gotoPage({
        //   url: '/pages/class/index/index',
        //   openType: 'reLaunch'
        // })
      }

      util._setStorageSync('localClassid', id ? id : '')
      self._countDown()
    })
  },
  /**
   * 根据 sence 获取班级id
  */
  getClassidBySence: function () {
    let self = this

    wx.showLoading({
      mask: true
    })

    let scene = self.data.pageOptions.scene ? self.data.pageOptions.scene : ''

    util.request({
      url: config.apiUrl + '/hr/class/class_wxapp/get_scene',
      data: {
        scene: scene
      },
      method: "POST",
      withSessionKey: true
    }).then(res => {
      let data = res.data

      if (res.result == 0) {
        util.gotoPage({
          url: '/' + data.path,
          openType: 'reLaunch'
        })
      } else {

      }

      // util._setStorageSync('localClassid', id)
      self._countDown()
    })
  },
  /**
   * 考试类型选择
   **/
  _showTest: function (e) {
    let self = this
    let data = e.currentTarget.dataset

    if (data.type == 0) {
      util.gotoPage({
        url: util.addParam2url('/pages/course/list/list', data)
      })
    } else {
      util.gotoPage({
        url: util.addParam2url('/pages/exam/testlist/testlist', data)
      })
    }

  },
  _joinClass: function (e) {
    let self = this
    let data = e.currentTarget.dataset
    if (data.open == 1) {
      self.setData({
        ['POPUP.isShow']: true,
        ['POPUP.optionsData']: data
      })
    } else if (data.open == 0) {
      let url = ''
      if (data.type == 1) {
        url = '/pages/exam/test/test'
      } else {
        url = '/pages/exam/test2/test2'
      }
      util.gotoPage({
        url: util.addParam2url(url, data),
        openType: 'navigateTo'
      })
    }
  },

  /**
   * 获取手机号码回调
   */
  _confirmEvent(opts) {
    let self = this
    let data = {}

    if (opts) {
      data = opts
    } else {
      data = arguments[0].detail.getPhoneNumberData
    }

    util.request({
      url: config.apiUrl + '/hr/special/wxapp/autoRegister',
      data: data,
      method: "POST",
      withSessionKey: true
    }).then(res => {

      if (res.result == 0) {
        util._setStorageSync('isLogin', 1)
        self.setData({
          ['POPUP.isLogin']: true
        })

        util.runFn(self.getInitData)
      }

    })
  },
  //获取手机号码授权
  getPhoneNumber: function (e) {
    let self = this;;
    let data = e.detail
    if (data.encryptedData && data.iv) {
      util._setStorageSync('authData', data)

      util.runFn(self._confirmEvent, null, data)
    } else {
      util.gotoPage({
        url: '/pages/login/login'
      })
    }

  },
  //获取分享图
  _getShareImage: function () {
    let self = this
    let postData = {}
    let localid = util._setStorageSync('localClassid')

    if (localid) {
      postData = {
        type: 1,
        id: localid
      }
    }

    if (self.data.pageOptions.id) {
      postData = {
        type: 1,
        id: self.data.pageOptions.id
      }
    }

    if (self.data.pageData.classInfo.id) {
      postData = {
        type: 1,
        id: self.data.pageData.classInfo.id
      }
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
          ['shareData.path']: util.addParam2url('/' + self.route, 'id', postData.id)
        })
      } else {
        wx.showToast({
          title: res.msg,
          icon: 'none'
        })
      }
    })
  },

  //查看课程视频/音频
  _showCourse: function (e) {
    let self = this
    let data = e.currentTarget.dataset
    util.gotoPage({
      url: util.addParam2url('/pages/course/index/index', data)
    })

  },
  //查看更多
  _checkMore: function (e) {
    let self = this
    let data = e.currentTarget.dataset

    if (data.catid != self.data.pageCatid) {
      self.setData({
        pageCatid: data.catid,
        pageIndex: 2
      })
    }

    wx.showLoading({
      mask: true
    })

    util.request({
      url: config.apiUrl + '/hr/class/class_wxapp/courseMore',
      data: {
        classid: data.classid,
        catid: self.data.pageCatid,
        page: self.data.pageIndex
      },
      method: "POST",
      withSessionKey: true
    }).then(res => {
      let resdata = res.data
      if (res.result === 0) {
        if (resdata && resdata.length > 0) {
          let obj = 'pageData.cats[' + data.index + '].courses'
          self.setData({
            [obj]: self.data.pageData.cats[data.index].courses.concat(resdata),
            pageIndex: ++self.data.pageIndex
          })
        }
      } else if (res.result == 100) {
n
      } else {
        wx.showToast({
          title: res.msg,
          icon: 'none'
        })
      }
    })
  },


  /**
   * isShowFull
   */
  isShowFull: function (e) {
    let self = this
    let data = e.currentTarget.dataset.index

    let obj = 'pageData.cats[' + data + '].isShowFull'
    let val = self.data.pageData.cats[data].isShowFull

    self.setData({
      [obj]: !val
    })
  },
})