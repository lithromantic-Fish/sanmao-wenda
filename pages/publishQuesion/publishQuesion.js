let util = require('../../utils/util');
let config = require('../../config');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    labels: [],
    isLogin: false,
    hasSelectedList: [],//存储点击过的标签数组
    idList:[],
    publishTitle:'',
    publishContent:''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.setData({
      isLogin: util._getStorageSync('isLogin') == 1 ? true : false
    })



    //获取问题标签
    this.getLabelList()
  },


  //获取问题标签
  getLabelList() {
    util.request({
      url: config.apiUrl + '/hr/group/question/get_cates',
      method: "POST",
      withSessionKey: false,
      autoHideLoading:false
    }).then(res => {
      console.log(res)
      res.data.forEach(ele => {
        ele.isSelect = false //是否点击状态，默认未点击
      })
      this.setData({
        labels: res.data
      })
    })
  },

  // 点击标签
  _label(e) {
    console.log(e.currentTarget.dataset.id)
    let label_id = e.currentTarget.dataset.id
    this.data.labels.forEach((ele, idx) => {
      if (ele.id == label_id) {
        ele.isSelect = !ele.isSelect
        if (ele.isSelect) {    
          console.log("11111111",this.data.hasSelectedList)                         
          if (this.data.hasSelectedList.length >= 3) {
            wx.showToast({
              title: '最多添加三个标签哦',
              icon: "none"
            })
            ele.isSelect = false
            return
          } else {
            console.log("22222222",this.data.hasSelectedList)                         
            this.data.hasSelectedList.push(ele)
          }
        } else {
          this.data.hasSelectedList.pop()
        }
        this.setData({
          labels: this.data.labels
        })
      }
    })

  },

  //输入标题
  publishTitle(e){
    console.log(e)
    this.setData({
      publishTitle: e.detail.value
    })
  },
  //输入内容
  publishContent(e){
    console.log(e)
    this.setData({
      publishContent: e.detail.value
    })
  },
  
  //发布问题
  submit(e) {

    let formId =  e.detail.formId
    console.log("eeeee",e)
    console.log('arr', this.data.hasSelectedList)
    if (this.data.hasSelectedList){
      this.data.hasSelectedList.forEach((ele,idx)=>{
       this.data.idList.push(ele.id)
      })
      var id  = this.data.idList.join(",")
      console.log(id)
      
    }
    util.request({
      url: config.apiUrl + '/hrloo.php?m=group&c=anli&a=ajax_huati2',
      method: "POST",
      data: {
        subject: this.data.publishTitle,
        text: this.data.publishContent,
        content_cate: id,
      },
      autoHideLoading:false,
      withSessionKey: true
    }).then(res => {
      this.setData({
        idList: []
      })
        const  parms = {
          formid: formId
        }
        util.request({
          url: config.apiUrl + '/hr/special/wxapp/save_formid_cache ',
          method:"POST",
          data: parms,
          withSessionKey:true,
          autoHideLoading:false

        }).then(res=>{
          console.log("搜集formid",formId)
        })
      if (res.result == 0) {

        wx.showToast({
          title: "发布成功",
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

  //拉起手机授权
  _getPhoneNumber: function(res) {
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
  _confirmEvent: function(opts) {
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
      withSessionKey: true,
      autoHideLoading:false
    }).then(res => {

      if (res.result == 0) {
        util._setStorageSync('isLogin', 1)
        self.setData({
          ['isLogin']: true
        })

        // util.runFn(self.getInitData)
      } else {
        wx.showToast({
          title: res.msg,
          icon: 'none'
        })
      }

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