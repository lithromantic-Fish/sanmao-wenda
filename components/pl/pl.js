// components/Dialog/dialog.js
let util = require('../../utils/util');
let config = require('../../config');

const app = getApp()

Component({
  options: {
    multipleSlots: true // 在组件定义时的选项中启用多slot支持
  },
  /**
   * 组件的属性列表
   * 用于组件自定义设置
   */
  properties: {
    // 这里定义了属性，属性值可以在组件使用时指定
    pldata: {
      type: Object,
      value: {},
    },
    isShow: {
      type: Boolean,
      value: false
    },
    islogin: {
      type: Boolean,
      value: false
    },
    open: {
      type: Number,
      value: 0
    }
  },

  /**
   * 私有数据,组件的初始数据
   * 可用于模版渲染
   */
  data: {
    // 这里是一些组件内部数据
    islogin: false,
    system: 0,
    textarea: {
      placeholder: '您可以发表关于课程的预习、内容、讲解方法及遇到的问题，课程讲师和同学将为你答疑解惑。',
      value: '',
      valueLength: 0
    },
    button: {
      issend: false
    },
    plTab: {
      type: 1,
      page: 0
    },
    initPostData: {
      tid: 0,
      type: 6,
      myhf: 0,
      page: 1
    },
    postPLData: {
      tid: 0,
      type: 0,
      pid: 0,
      topid: 0,
      text: ''
    },
    PLDATA: {},
    dataList: {},
    PLIsHaveMore: true,
    creatNewPL: {
      index: 0
    }
  },
  //组件生命周期函数
  attached: function() {
    let self = this;
    // console.info('组件生命周期函数',self.data.isShow)

    if (util.type(self.data.pldata) == 'object') {

      util.runFn(self._getDataList, self)
    }
    let sys = app.GD.systemInfo.system
    if (sys.indexOf('Android') > -1) {
      self.setData({
        system: 1
      })
    }

  },
  /**
   * 组件的方法列表
   * 更新属性和数据的方法与更新页面数据的方法类似
   */
  methods: {

    //获取手机号码授权后相关操作
    _getPhoneNumber: function(e) {
      let self = this;;
      let data = e.detail
      if (data.encryptedData && data.iv) {
        util._setStorageSync('authData', data)

        var myEventDetail = {
          'getPhoneNumberData': data
        } // detail对象，提供给事件监听函数
        var myEventOption = {} // 触发事件的选项

        //触发成功回调
        self.triggerEvent("confirmEvent", myEventDetail, myEventOption);

      } else {
        util.gotoPage({
          url: '/pages/login/login'
        })
      }

    },
    //
    _showHidePL: function() {
      let self = this
      self.setData({
        isShow: !self.data.isShow
      })
      let myEventDetail = {
        'isShow': self.data.isShow
      } // detail对象，提供给事件监听函数
      let myEventOption = {} // 触发事件的选项

      //触发成功回调
      self.triggerEvent("isHiddenVideo", myEventDetail, myEventOption)
    },
    /**
     * 获取评论数据
     */
    _getDataList: function() {
      let self = this
      let initPostData = {
        'data[tid]': self.data.pldata.id,
        'data[type]': self.data.initPostData.type,
        'data[myhf]': self.data.initPostData.myhf,
        'data[page]': self.data.initPostData.page
      }

      wx.showLoading({
        title: '',
        mask: true
      })
      util.request({
        url: config.apiUrl + '/hrloo.php?m=wappl&c=wappl&a=loadpl',
        data: initPostData,
        method: "POST",
        withSessionKey: true
      }).then(res => {
        let data = res.data.data
        if (res.result == 0) {
          if (self.data.initPostData.page > 1) {
            if (data.list.length) {
              self.setData({
                PLDATA: data,
                dataList: self.data.dataList.concat(data.list)
              })
            } else {
              self.setData({
                PLIsHaveMore: false
              })
              // wx.showToast({
              //   title: '没有更多啦',
              //   icon: 'none'
              // })
            }
          } else {
            self.setData({
              PLDATA: data,
              dataList: data.list
            })
          }

        } else {
          wx.showToast({
            title: res.msg,
            icon: 'none'
          })
        }
      })
    },
    /**
     *  评论输入框输入事件
     */
    _bindlinechange: function(e) {
      // console.info(e)
    },
    /**
     *  评论输入框输入事件
     */
    _bindinput: function(e) {
      let value = util.trim(e.detail.value)
      let cursor = value.length
      let self = this

      self.setData({
        ['textarea.value']: value,
        ['textarea.valueLength']: value.length
      })

      if (cursor > 0) {
        self.setData({
          ['button.issend']: true
        })
      } else {
        self.setData({
          ['button.issend']: false
        })
      }
    },
    /**
     * 去评论
     */
    _gotoPL: function(e) {
      let self = this
      let data = e.target.dataset
      self.setData({
        ['creatNewPL.index']: data.index,
        ['postPLData.tid']: data.tid,
        ['postPLData.pid']: data.pid,
        ['postPLData.topid']: data.topid,
        ['postPLData.type']: data.type,
        ['postPLData.nickname']: data.nickname,
      })
      // self._showHidePL()
      util.runFn(self._showHidePL, self)
    },
    /**
     * _sendPL 提交评论
     */
    _sendPL: function(e) {
      let self = this
      let data = e.target.dataset

      if (!data.issend) {
        return
      }

      let postPLData = {}

      if (self.data.creatNewPL.index != -1) {
        postPLData = {
          'data[tid]': self.data.postPLData.tid,
          'data[type]': self.data.postPLData.type,
          'data[pid]': self.data.postPLData.pid,
          'data[topid]': self.data.postPLData.topid,
          'data[text]': '@' + self.data.postPLData.nickname + '  ' + self.data.textarea.value
        }
      } else {
        postPLData = {
          'data[tid]': self.data.postPLData.tid,
          'data[type]': self.data.postPLData.type,
          'data[pid]': self.data.postPLData.pid,
          'data[topid]': self.data.postPLData.topid,
          'data[text]': self.data.textarea.value
        }
      }

      util.request({
        url: config.apiUrl + '/hrloo.php?m=wappl&c=wappl&a=ajaxpl',
        data: postPLData,
        method: "POST",
        withSessionKey: true,
        autoHideLoading: false
      }).then(res => {
        if (res.result == 0 || res.result == 1) {
          wx.showToast({
            title: res.msg,
            mask: true,
            icon: 'none'
          })

          util.runFn(self._showHidePL, self)
          if (res.result == 0) {
            let vd = res.data.html
            //如果是1级评论
            if (self.data.creatNewPL.index == -1) {
              let selfData = self.data.dataList ? self.data.dataList : []
              let newData = {
                avatar: vd.avatar,
                nickname: vd.nickname,
                date: vd.date,
                text: vd.text,
                id: vd.id,
                uid: vd.uid,
                reply_count: 0,
                lists: [],
              }
              selfData.unshift(newData)
              self.setData({
                ['PLDATA.allhfcount']: self.data.PLDATA.allhfcount > 0 ? ++self.data.PLDATA.allhfcount : 1,
                ['PLDATA.myhfcount']: self.data.PLDATA.myhfcount > 0 ? ++self.data.PLDATA.myhfcount : 1,
                dataList: selfData
              })

            } else {
              //如果是2级回复
              let selfData = self.data.dataList[self.data.creatNewPL.index].lists ? self.data.dataList[self.data.creatNewPL.index].lists : []
              let obj = 'dataList[' + self.data.creatNewPL.index + '].lists'
              let newData = {
                nickname: vd.nickname,
                text: vd.text,
              }
              selfData.push(newData)
              self.setData({
                [obj]: selfData
              })
            }
            self.setData({
              ['textarea.value']: '',
              ['button.issend']: false
            })

          }
        } else {
          wx.showToast({
            title: res.msg,
            icon: 'none'
          })
        }
      })

    },
    /**
     * 全部评论/与我相关
     */
    _plChangeTab: function(e) {
      let self = this
      let _type = e.target.dataset.type

      self.setData({
        ['initPostData.page']: 1,
        ['plTab.type']: _type
      })

      if (_type == 1) {
        self.setData({
          ['initPostData.myhf']: 0
        })
      }
      if (_type == 2) {
        self.setData({
          ['initPostData.myhf']: 1
        })
      }

      util.runFn(self._getDataList, self)
    },
    /*
     * 查看更多
     */
    _getMore: function() {
      let self = this

      if (!self.data.PLIsHaveMore){
        return
      }

      self.setData({
        ['initPostData.page']: ++self.data.initPostData.page
      })

      util.runFn(self._getDataList, self)
    },
    _showTip: function () {
      wx.showModal({
        title: '',
        content: '您当前不是班级成员',
        showCancel: false
      })
    }
  }
})