// pages/answerQuesion/answerQuesion.js
let util = require('../../utils/util');
let config = require('../../config');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    view_count: null,
    time: '',
    voiceList: [],
    isPlay: false,
    hasPlay: false,
    duration: '',
    recordStatus: 1, //语音授权 1未授权，2已授权
    isTouchUp: false,
    music_length: null,
    touchS: [0, 0], //触摸开始的x,y轴
    questesId: null,
    voice_id: null,
    isShowToast:false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    console.log(options)
    this.setData({
      questesId: options.questionId,
      view_count: options.view_count
    })

    //获取全局唯一的录音管理器 RecorderManager
    this.recorderManager = wx.getRecorderManager()
    this.recorderManager.onError((res) => {
      wx.showToast({
        title: '录音失败',
        icon: 'none'
      })
      console.log('录音失败了！', res)
    })
  },

  //录音
  sayVoice(e) {
    let that = this

    wx.authorize({
      scope: 'scope.record',
      success() {
        console.log("录音授权成功");
        //第一次成功授权后 状态切换为2
        that.setData({
          recordStatus: 2,
        })
        // 用户已经同意小程序使用录音功能，后续调用 wx.startRecord 接口不会弹窗询问
        // wx.startRecord();

        //使用新版录音接口，可以获取录音文件
      },
      fail() {
        console.log("第一次录音授权失败");
        wx.showModal({
          title: '提示',
          content: '您未授权录音，功能将无法使用',
          showCancel: true,
          confirmText: "授权",
          confirmColor: "#52a2d8",
          success: function(res) {
            if (res.confirm) {
              //确认则打开设置页面（重点）
              wx.openSetting({
                success: (res) => {
                  console.log(res.authSetting);
                  if (!res.authSetting['scope.record']) {
                    //未设置录音授权
                    console.log("未设置录音授权");
                    wx.showModal({
                      title: '提示',
                      content: '您未授权录音，功能将无法使用',
                      showCancel: false,
                      success: function(res) {},
                    })
                  } else {
                    //第二次才成功授权
                    console.log("设置录音授权成功");
                    that.setData({
                      recordStatus: 2,
                    })
                  }
                },
                fail: function() {
                  console.log("授权设置录音失败");
                }
              })
            } else if (res.cancel) {
              console.log("cancel");
            }
          },
          fail: function() {
            console.log("openfail");
          }
        })
      }
    })
    if (that.data.recordStatus == 2) {
      this.setData({
        isShowToast:true
      })
      // wx.showToast({
      //   title: '上滑取消',
      //   image: '/images/ic_say.gif',
      //   duration: 60000
      // })
      if (that.data.voiceList.length > 0) {
        this.setData({
          isShowToast: false
        })
        wx.showToast({
          title: '只能发一条语音哦',
          icon: 'none'
        })
        return
      }

      this.recorderManager.onStart(() => {
        console.log('recorder start')
      })
      this.recorderManager.onPause(() => {
        console.log('recorder pause')
      })
      this.recorderManager.onStop((res) => {
        let I = parseInt(res.duration)
        let F = I / 1000
        let len = parseInt(F)
        console.log(len)
        if (len < 3) {
          this.setData({
            isShowToast: false
          })
          wx.showToast({
            title: '说话时间太短',
            image: '/images/ic_short.png'
          })
          return
        }
        //上滑操作
        if (that.data.isTouchUp) {
          this.setData({
            isShowToast: false
          })
          wx.showToast({
            title: '已取消',
            icon: 'none'
          })
          return
        }
        this.setData({
          isShowToast: false
        })
        wx.showLoading({
          title: '语音上传中...',
        })
        const {
          tempFilePath
        } = res;
        //上传语音
        util.uploadSink(tempFilePath).then(res => {
          this.data.voiceList.push(res)
          this.setData({
            voiceList: this.data.voiceList,
            time: res.dateline,
            music_length: res.music_length,
            voice_id: res.voice_id
          })
          wx.hideLoading()
        }).catch(err => {
          Error('errrrrrrrr',err)
        });

      })

      this.recorderManager.onFrameRecorded((res) => {
        const {
          frameBuffer
        } = res
        console.log('frameBuffer.byteLength', frameBuffer.byteLength)
      })

      const options = {
        duration: 60000,
        sampleRate: 44100,
        numberOfChannels: 1,
        encodeBitRate: 192000,
        format: 'aac',
        frameSize: 50
      }

      this.recorderManager.start(options)
    } else {
      console.log("未授权")
    }

  },
  submit(e) {
    if (this.data.voiceList.length==0){
      wx.showToast({
        title: '提交内容不能为空',
        icon:'none'
      })
      return
    }
    let formId = e.detail.formId
    let that = this
    util.request({
      url: config.apiUrl + '/hrloo.php?m=questions&c=index&a=ajax_reply',
      method: "POST",
      withSessionKey: true,
      autoHideLoading: false,

      data: {
        tid: that.data.questesId,
        text: '',
        pid: 0,
        topid: 0,
        voice_id: that.data.voice_id,
        modifyid: 0
      }
    }).then(res => {
      console.log('res111111', res)
      const parms = {
        formid: formId
      }
      util.request({
        url: config.apiUrl + '/hr/special/wxapp/save_formid_cache ',
        method: "POST",
        data: parms,
        autoHideLoading: false,

        withSessionKey: true
      }).then(res => {
        console.log("搜集formid", formId)
      })
      if (res.result == 0) {
        console.log('res',res)
          wx.showToast({  
            title: res.msg,
            duration:1500
          })
      
      } else{
        wx.showToast({
          title: res.msg,
          icon: 'none',
          duration: 1500
        })
      }
    })

  },
  //触摸开始

  touchStart(e) {
    let sx = e.touches[0].pageX
    let sy = e.touches[0].pageY
    console.log('触摸开始', sx)
    console.log('触摸开始yyyyyyyyyyy', sy)
    console.log('触摸开始', e)

    this.setData({
      touchS: [sx, sy],
    })
  },
  //触摸移动
  touchMove(e) {

  },

  //触摸结束
  touchEnd(e) {


    let touchMoveX = e.changedTouches[0].pageX;
    let touchMoveY = e.changedTouches[0].pageY;
    console.log("touchMoveX", touchMoveX)
    console.log("touchMoveY", touchMoveY)

    if ((this.data.touchS[1] - touchMoveY) > 50) {
      console.log('上滑了')
      this.setData({
        isTouchUp: true
      })
    } else {
      this.setData({
        isTouchUp: false
      })
    }


    console.log('触摸结束', e)
    if (this.data.recordStatus == 2) {
      this.recorderManager.stop()
    }
    // wx.stopRecord() // 结束录音
    wx.hideToast()
  },
  //播放音频
  palyVocie(e) {
    wx.showLoading({
      title: '加载中...',
    })
    console.log(e.currentTarget.dataset.item)
    let voicePath = e.currentTarget.dataset.item.music
    const innerAudioContext = wx.createInnerAudioContext()
    innerAudioContext.autoplay = true
    innerAudioContext.src = voicePath
    innerAudioContext.onPlay(() => {
      console.log('开始播放')
      wx.hideLoading()
      this.setData({
        isPlay: true
      })
    })
    innerAudioContext.onError((res) => {
      console.log(res.errMsg)
      console.log(res.errCode)
    })
    innerAudioContext.onEnded((res) => {
      this.setData({
        isPlay: false
      })
      console.log("播放自然结束")
    })

  },
  //删除音频
  deleteVocie(e) {
    const that = this
    let voicePath = e.currentTarget.dataset.item
    wx.showModal({
      title: '删除语音',
      content: '确定要删除该语音？',
      success: function(res) {
        if (res.confirm) {
          that.setData({
            voiceList: []
          })
        } else {

        }
      },
      fail: function(res) {}, //接口调用失败的回调函数
      complete: function(res) {}, //接口调用结束的回调函数（调用成功、失败都会执行）
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
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})