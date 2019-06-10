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
    // 弹窗类型
    popupType: { // 属性名
      type: Number, // 类型（必填），目前接受的类型包括：String, Number, Boolean, Object, Array, null（表示任意类型）
      value: 1 // 属性初始值（可选），如果未指定则会根据类型选择一个
    },
    // 是否已经登录
    isLogin: {
      type: Boolean,
      value: false
    },
    //是否显示 
    isShow: {
      type: Boolean,
      value: false
    },
    optionsData: {
      type: Object,
      value: {}
    }
  },

  /**
   * 私有数据,组件的初始数据
   * 可用于模版渲染
   */
  data: {
    // 弹窗显示控制
    userInfo: null
  },
  //组件生命周期函数
  attached: function () {
    let self = this;
  },
  /**
   * 组件的方法列表
   * 更新属性和数据的方法与更新页面数据的方法类似
   */
  methods: {
    /*
     * 公有方法
     */

    //隐藏弹框
    hideDialog: function () {

      console.info(this)
      this.setData({
        isShow: !this.data.isShow
      })
    },
    //展示弹框
    showDialog: function() {
      this.setData({
        isShow: !this.data.isShow
      })
    },
    _iKnow: function(){
      let self = this
      self.triggerEvent("iKnow");
    },
    /*
    * 内部私有方法建议以下划线开头
    * triggerEvent 用于触发事件
    */
    // _cancelEvent() {
    //   //触发取消回调
    //   this.triggerEvent("cancelEvent")
    // },
    // _confirmEvent() {
    //   //触发成功回调
    //   this.triggerEvent("confirmEvent");
    // },
    //获取手机号码授权
    _getPhoneNumber: function(e){
      // console.info(e.detail)
      let self = this
      let data = e.detail
      if (data.encryptedData && data.iv) {
        //authData
        util._setStorageSync('authData', data);

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
  }
})