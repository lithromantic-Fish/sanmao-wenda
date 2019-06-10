let util = require('../../utils/util');
let config = require('../../config');

//获取应用实例
const app = getApp()

Component({
  properties: {
    // 这里定义了属性，属性值可以在组件使用时指定
    isShowBackHome: {
      type: Boolean,
      value: true,
    },
  },
  data: {
    // 这里是一些组件内部数据
    customData: {},
    model: {
      iphoneX: false
    }
  },
  //组件生命周期函数
  attached: function() {
    let self = this;
    self._getInitData()

    let model = app.GD.systemInfo.model
    // app.GD.systemInfo 
    // 固定底部的 tab 做兼容
    if (model.indexOf('iPhone X') > -1) {
      self.setData({
        ['model.iphoneX']: true
      })
    }
  },
  moved: function() {},
  detached: function() {},
  methods: {
    // 这里是一个自定义方法
    _getInitData: function() {
      let self = this
      wx.showLoading({
        title: '',
        mask: true
      })

      util.request({
        url: config.apiUrl + '/hr/special/wxapp/auth_page_setting',
        data: {},
        method: "POST",
        withSessionKey: true
      }).then(res => {
        let data = res.data
        if (res.result === 0) {
          self.setData({
            ['customData']: data.class ? data.class : ''
          })
        } else {
          wx.showToast({
            title: res.msg,
            icon: 'none'
          })
        }
      })
    },

    //跳转
    _jump: function(e){
      let self = this
      let data = e.target.dataset
      console.info(data)

      if (data.url == '' || data.url == undefined) return;

      util.gotoPage({
        url : data.url,
        openType: 'reLaunch'
      })
    }
  }
})