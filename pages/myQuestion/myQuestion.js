// pages/myFollowQuestion/myFollowQuestion.js
let util = require('../../utils/util');
let config = require('../../config');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isLoadAll: false,//是否加载全部
    pages: null,        //分页的总数
    page: 1,
    questionList: [    //关注的问题列表

    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    if (this.data.pages == 1 || this.data.pages == this.data.page) {
      this.setData({
        isLoadAll: true
      })
    }
  },
  //跳转问答详情页面
  toQuession(e) {
    let d = e.currentTarget.dataset.item
    wx.navigateTo({
      url: '/pages/questionDetail/questionDetail?id=' + d.tid,
    })
  },
  //我的提问
  getPageData: util.debounce(function () {
    wx.showLoading({
      title: '加载中...',
    })
    let that = this
    util.request({
      url: config.apiUrl + '/hr/group/question/mythreads',
      method: "POST",
      withSessionKey: true,
      data: {
        tab: 2,
        page: that.data.page

      }
    }).then(res => {
      wx.hideLoading()
      let data = res.data.data
      console.log('data', data)
      if (res.result == 0) {
        if (that.data.page > 1) {
          that.setData({
            questionList: this.data.questionList.concat(data),
            pages: res.data.pages,
          })
        } else {
          that.setData({
            questionList: data,
            pages: res.data.pages,
          })
        }
      }
    })
  }, 500),
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.getPageData()

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
    // 下拉刷新，回到第一页
    this.setData({
      page: 1
    })
    this.getPageData();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    let addPage = this.data.page
    if (addPage == this.data.pages) {
      wx.showToast({
        title: '已加载全部'
      })
      return
    }
    else {
      ++addPage
      this.setData({
        page: addPage
      })
    }
    this.getPageData();

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})