// components/Dialog/dialog.js
let util = require('../../utils/util');
//获取应用实例
const app = getApp()

Component({
  properties: {
    // 这里定义了属性，属性值可以在组件使用时指定
    isShowBack: {
      type: Boolean,
      value: true,
    },
    isShowTitle: {
      type: Boolean,
      value: true,
    },
    navigationTitle: {
      type: String,
      value: ''
    }
  },
  data: {
    // 这里是一些组件内部数据
    customData: {},
    navigationClass: '', //用来兼容 手机顶部导航栏的高度,
    height: 0
  },
  //组件生命周期函数
  attached: function () {
    let self = this;
    self.setData({
      statusBarHeight: app.GD.statusBarHeight,
      titleBarHeight: app.GD.titleBarHeight
    })
  },
  moved: function () { },
  detached: function () { },
  methods: {
    // 这里是一个自定义方法
    _back: function(){
       wx.navigateBack();
    }
  }
})