// components/Dialog/dialog.js
let util = require('../../utils/util');
//获取应用实例
const app = getApp()

Component({
  properties: {
    // 这里定义了属性，属性值可以在组件使用时指定
    isShowBackHome: {
      type: Boolean,
      value: true,
    },
    tabIndex: {
      type: Number,
      value: 1,
    },
  },
  data: {
    // 这里是一些组件内部数据
    customData: {},
    navigationClass: '', //用来兼容 手机顶部导航栏的高度
    model: {
      iphoneX: false
    }
  },
  //组件生命周期函数
  attached: function () {
    let self = this;
    let model = app.GD.systemInfo.model
    // app.GD.systemInfo 
    // 固定底部的 tab 做兼容
    if (model.indexOf('iPhone X')> -1){
      self.setData({
        ['model.iphoneX']: true
      })
    }
  },
  moved: function () { },
  detached: function () { },
  methods: {
    // 这里是一个自定义方法
    customMethod: function () { }
  }
})