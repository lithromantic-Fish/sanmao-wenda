// components/Dialog/dialog.js
let util = require('../../utils/util');
let config = require('../../config');
//获取应用实例
const app = getApp()

Component({
  properties: {
    // 这里定义了属性，属性值可以在组件使用时指定
    isBackgroundMusic: {
      type: Boolean,
      value: false,
    },
    isShowShare: {
      type: Boolean,
      value: true,
    },
    isShowContact: {
      type: Boolean,
      value: true
    }
  },
  data: {
    // 这里是一些组件内部数据
    BackgroundAudioPlayerStateData: {},
    _timer: null,
  },
  //组件生命周期函数
  attached: function() {
    let self = this;

    // wx.getBackgroundAudioPlayerState({
    //   success: function(res) {
    //     let status = res.status
    //     let dataUrl = res.dataUrl
    //     let currentPosition = res.currentPosition
    //     let duration = res.duration
    //     let downloadPercent = res.downloadPercent

    //     if (status == 1) {
    //       let bgMusic = util._getStorageSync('bgMusic')

    //       self.setData({
    //         isBackgroundMusic: true,
    //         bgMusic: bgMusic
    //       })
    //     }

    //   }
    // })

    //实时更是播放状态, 如果停止,隐藏浮标
    self.data._timer = setInterval(function () {
      wx.getBackgroundAudioPlayerState({
        success: function (result) {
          let _status = result.status
          // console.info(_status)
          if (_status != 1) {
            // clearInterval(self.data._timer)
            self.setData({
              isBackgroundMusic: false
            })
          } else if (_status == 1) {
            let bgMusic = util._getStorageSync('bgMusic')

            self.setData({
              isBackgroundMusic: true,
              bgMusic: bgMusic
            })
          }
        }
      })
    }, 500)

  },
  moved: function() {},
  detached: function() {},
  methods: {

  }
})