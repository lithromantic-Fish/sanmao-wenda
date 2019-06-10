// components/qaList/qaList.js
let util = require('../../utils/util');
let config = require('../../config');
const app = getApp()

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    qaList: {
      type: Array,
      value:[]
    },
    tab:{
      type:Number,
      value:null
    },
    isSearch:{
      type:Boolean,
      value:false
    },
    isDetail:{
      type:Boolean,
      value:false
    }
  },
  /**
   * 组件的初始数据
   */
  data: {
  },
  methods:{
    //播放语音
    playVoice(e) {
      console.log('e',e)
      wx.showLoading({
        title: '加载中...',
      })
      let that = this
      console.log('e.currentTarget.dataset.item.pl.voice.music', e.currentTarget.dataset.index)
      let index = e.currentTarget.dataset.index
      let voicePath = e.currentTarget.dataset.item.pl.voice.music
      const innerAudioContext = wx.createInnerAudioContext()
      innerAudioContext.autoplay = true
      innerAudioContext.src = encodeURI(voicePath);
      console.log("voicePath", voicePath)
      innerAudioContext.onPlay(() => {
        wx.hideLoading()
        that.data.qaList[index].isPlay = true
        that.setData({
          qaList: that.data.qaList
        })
        console.log('开始播放')
      })
      innerAudioContext.onError((res) => {
        console.log(res.errMsg)
        console.log(res.errCode)
      })
      innerAudioContext.onEnded((res) => {
        that.data.qaList[index].isPlay = false
        that.setData({
          qaList: that.data.qaList
        })
        console.log("播放自然结束")
      })
    },


    //去问题详情页
    toQuestionDetail(e){
      if (this.data.isDetail) return
      console.log(e.currentTarget.dataset.item.id)
        wx.navigateTo({
          url: '/pages/questionDetail/questionDetail?id=' + e.currentTarget.dataset.item.id,
        })
    }
  },
})