let util = require('../../utils/util');
let config = require('../../config');
const app = getApp()

// components/search/search.js
Component({
  /**
   * 组件的属性列表 
   */
  properties: {
    inputVal: { //输入框输入值
      type: String,
      value: ''
    },
    placeholder: { //输入框默认提示语
      type: String,
      value: '请输入关键字'
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    // inputVal: '',
  },

  /**
   * 组件的方法列表
   */
  methods: {
    //输入框输入事件
    _searchInput: function (e) {
      const {
        value
      } = e.detail
      let val = util.trim(value) //去除空格
      console.log('val', val)
      this.setData({
        inputVal: val //输入框赋值
      })
      this.triggerEvent('getSearchValue', {
        value: val
      })
    },
    //输入框后取消按钮事件
    _searchInputCancel: function () {
      this.setData({
        inputVal: '' //输入框清空
      })
      this.triggerEvent('getSearchValue', {
        value: ''
      })
    },
    getSearchResult(e) {
      const {
        value
      } = e.detail
      let val = util.trim(value) //去除空格
      console.log('val', val)
      this.setData({
        inputVal: val //输入框赋值
      })
      this.triggerEvent('getSearchValue', {
        value: val
      })
    }
  }
})