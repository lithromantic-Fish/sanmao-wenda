// pages/answerQuesionText/answerQuesionText.js
let util = require('../../utils/util');
let config = require('../../config');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    inputVal: '',
    questesId: null,
    tid:null,
    pid:null,
    topid:null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options)

    if(options.topid){
      console.log("回复为三级")

    }else{
      console.log("回复为二级")
    }
    this.setData({
      inputVal:'@'+options.name+':',
      tid:options.tid,
      pid:options.pid,
      topid: options.topid ? options.topid :0
    })
  },
  formSubmit(e) {
    let formId = e.detail.formId
    wx.showLoading({
      title: '加载中...',
    })
    let that = this
    util.request({
      url: config.apiUrl + '/hrloo.php?m=questions&c=index&a=ajax_reply',
      method: "POST",
      withSessionKey: true,
      autoHideLoading: false,
      
      data: {
        tid: that.data.tid,
        text: that.data.inputVal,
        pid: that.data.pid,
        topid: that.data.topid,
        voice_id: 0,
        modifyid: 0
      }
    }).then(res => {
      console.log('res111111', res)
      wx.hideLoading()
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

        console.log(11111111)
        wx.showToast({
          title: res.msg,
        })
        setTimeout(() => {
          wx.navigateBack({
          })
        }, 1500)
      }
      //提交审核中，返回上一页
      else if (res.result == 88) {
        console.log("2222222", res)
        wx.showToast({
          title: res.msg,
          icon: 'none',
          duration: 1500
        })
        setTimeout(() => {
          wx.navigateBack({
          })
        }, 1500)
      } else {
        wx.showToast({
          title: res.msg,
          icon: 'none',
          duration: 1500
        })
      }
    })

  },

  confirm(e) {
    const {
      value
    } = e.detail
    let val = util.trim(value) //去除空格
    console.log('val', val)
    this.setData({
      inputVal: val //输入框赋值
    })
  },
  answer_text(e) {
    const {
      value
    } = e.detail
    let val = util.trim(value) //去除空格
    console.log('val', val)
    this.setData({
      inputVal: val //输入框赋值
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})