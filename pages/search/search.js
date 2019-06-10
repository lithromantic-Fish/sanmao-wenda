// pages/search/search.js
let util = require('../../utils/util');
let config = require('../../config');
//获取应用实例
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    inputVal: '', //输入框输入值
    searchResult: [], //搜索结果
    page: 1,    //当前页数，默认为1
    pages: null,   //总页数
    qaList:[],
    //标签
    labels: [
    ],


  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    //获取问题标签
    this.getLabelList()
    console.log('inputVal', this.data.inputVal)
  },


  //获取问题标签
  getLabelList() {
    util.request({
      url: config.apiUrl + '/hr/group/question/get_cates',
      method: "POST",
      withSessionKey: false
    }).then(res => {
      console.log(res)
      res.data.forEach(ele => {
        ele.isSelect = false //是否点击状态，默认未点击
      })
      this.setData({
        labels: res.data
      })
      console.log('tttttt', this.data.labels)
    })
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    // 下拉刷新，回到第一页
    this.setData({
      page: 1
    })
    this.getSearchResult(this.data.inputVal)
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {
    let addPage = this.data.page
    if (addPage == this.data.pages) {
      wx.showToast({
        title: '已加载全部'
      })
      return
    }
    else {
      addPage = ++addPage
      this.setData({
        page: addPage
      })
    }
    this.getSearchResult(this.data.inputVal)

  },

  //请求数据
  getData: util.debounce(function(){

    console.info('this.data.inputVal', this.data.inputVal)
  },600),

  //搜索输入插件返回的 输入框中的值
  _getSearchValue: function(args) {
    let {
      value
    } = args.detail
    let val = util.trim(value)
    console.log('args', val)
    this.setData({
      inputVal: val
    })
    this.getSearchResult(this.data.inputVal)

    val && this.getData()
    if (!this.data.inputVal){
      this.setData({
        qaList:[]
      })
    }
  },



  //获取搜索结果
  getSearchResult: util.debounce(function (keyWord) {
    wx.showLoading({
      title: '加载中...',
    })

    let that = this
    util.request({
      url: config.apiUrl + '/hr/group/question/grp_search',
      method: "POST",
      withSessionKey: true,
      data: {
        keyword : keyWord,
        page: that.data.page,
      }
    }).then(res => {
      wx.hideLoading()
      let data = res.data.data
      if (res.result == 0) {
        console.log('res.data',res.data)
        if (that.data.page > 1) {
          if (res.data.data) {
            that.setData({
              qaList: this.data.qaList.concat(data)
            })
          }
        } else {
          that.setData({
            qaList: data,
            pages: res.data.pages
          })
        }
        that.data.qaList.forEach(ele => {
          ele.isPlay = false //是否播放音频标识
        })
        that.setData({
          qaList: that.data.qaList
        })
        console.log("qaList", that.data.qaList)
      }
    })
  }, 500),

  //标签点击
  _label: function (e) {
    let {
      name
    } = e.target.dataset

    this.setData({
      inputVal: name
    })
    console.log('inputVal',this.data.inputVal)
    this.getSearchResult(this.data.inputVal)
    // https://www.hrloo.com/hr/group/question/grp_search

  },
 

})