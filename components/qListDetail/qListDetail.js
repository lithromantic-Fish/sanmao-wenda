// components/qaList/qaList.js
let util = require('../../utils/util');
let config = require('../../config');

const app = getApp()

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    plList: {           //评论列表
      type: Array,
      value: []
    },
    isDetail: {         //是否为问答详情
      type: Boolean,
      value: false
    },
    questesId: {        //问答id
      type: Number,
      value: null
    },
    isLogin:{           //是否登录
      type:Boolean,
      value:false
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    plIndex: null,    //评论列表中获取更多事件中的下标
    pages: null,      //总页数
    isLike: false,    //是否点赞
    noReplay: false   //是否没有评论
  },
  methods: {
    //拉起手机授权
    _getPhoneNumber: function (res) {
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
    _confirmEvent: function (opts) {
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
        autoHideLoading: false,
        withSessionKey: true
      }).then(res => {

        if (res.result == 0) {
          util._setStorageSync('isLogin', 1)
          self.setData({
            ['isLogin']: true
          })
        self.triggerEvent('updateDetailData', {
            isUpdata : true
          })
          util.runFn(self.getInitData)
        } else {
          wx.showToast({
            title: res.msg,
            icon: 'none'
          })
        }

      })
    },
    //播放语音
    playVoice(e) {
      wx.showLoading({
        title: '加载中...',
      })
      let that = this
      console.log('e.currentTarget.dataset.item.pl.voice.music', e.currentTarget.dataset.index)
      let index = e.currentTarget.dataset.index
      let voicePath = e.currentTarget.dataset.item.music
      const innerAudioContext = wx.createInnerAudioContext()
      innerAudioContext.autoplay = true
      innerAudioContext.src = encodeURI(voicePath);
      console.log("voicePath", voicePath)
      innerAudioContext.onPlay(() => {
        wx.hideLoading()
        that.data.plList[index].isPlay = true
        that.setData({
          plList: that.data.plList
        })
        console.log('开始播放')
      })
      innerAudioContext.onError((res) => {
        console.log(res.errMsg)
        console.log(res.errCode)
      })
      innerAudioContext.onEnded((res) => {
        that.data.plList[index].isPlay = false
        that.setData({
          plList: that.data.plList
        })
        console.log("播放自然结束")
      })
    },

    //去问题详情页
    toQuestionDetail(e) {
      if (this.data.isDetail) return
      console.log(e.currentTarget.dataset.item.id)
      wx.navigateTo({
        url: '/pages/questionDetail/questionDetail?id=' + e.currentTarget.dataset.item.id,
      })
    },
    //获取更多评论
    getMore(e) {
      let index = e.currentTarget.dataset.index
      if (this.data.plList[index].second.index == this.data.plList[index].second.pages) {
        wx.showToast({
          title: '没有更多了',
        })
        return
      }
      ++this.data.plList[index].second.index
      this.setData({
        plIndex: index,
        plList: this.data.plList
      })
      console.log("e.currentTarget.dataset.index", e.currentTarget.dataset.index)
      console.log('that.data.plList', this.data.plList)

      this.getIndexData(this.data.questesId, e.currentTarget.dataset.pid)
    },
    //获取回复列表
    getIndexData: util.debounce(function (tid, pid) {
      console.log("this.data.plList[this.data.plIndex]", this.data.plList[this.data.plIndex])
      console.log("that.data.plList[that.data.plIndex].second.index", this.data.plList[this.data.plIndex].second.index)
      wx.showLoading({
        title: '加载中...',
      })
      let that = this
      util.request({
        url: config.apiUrl + '/hr/group/question/reply_list',
        method: "POST",
        withSessionKey: true,
        data: {
          tid: tid,
          pid: that.data.plList[that.data.plIndex].id,
          page: that.data.plList[that.data.plIndex].second.index
        }
      }).then(res => {
        let repList = that.data.plList[that.data.plIndex].second.data
        let data = res.data.data
        console.log('data', data)
        wx.hideLoading()
        if (res.result == 0) {
          //如果没有下一页就不显示加载更多
          if (that.data.plList[that.data.plIndex].second.index == that.data.plList[that.data.plIndex].second.pages) {
            that.setData({
              noReplay: true
            })
          }
          if (res.data.data) {
            that.data.plList[that.data.plIndex].second.data = that.data.plList[that.data.plIndex].second.data.concat(data)
            that.setData({
              plList: that.data.plList
            })
            console.log('plList', that.data.plList)
          }
        }
      }).catch(err => {
        console.log(err)
      })
    }, 500),
    
    //回复评论
    replay(e) {
      console.log(e.currentTarget.dataset)
      let d = e.currentTarget.dataset
      let that = this
      console.log(this.data.plList)
      if(d.replay){
        console.log("回复为三级评论")
        let data = {
          tid: that.data.questesId,
          pid: d.item.id,
          topid: d.replay.id,
        }
      wx.navigateTo({
        url: '/pages/replay/replay?tid=' + this.data.questesId + '&pid=' + d.item.id + '&topid=' + d.replay.id+'&name='+d.name,
      })
      }else{
        let data = {
          tid: that.data.questesId,
          pid: d.item.id,
        }
        console.log('回复为二级评论')
        wx.navigateTo({
          url: '/pages/replay/replay?tid=' + this.data.questesId + '&pid=' + d.item.id + '&topid=' + d.item.id+ '&name='+d.name,
        })
      }
    },

    //点赞
    like: util.debounce(function (e) {
      let formId = e.detail.formId

      console.log('点赞的item'+e.currentTarget.dataset.item)
      let id = e.currentTarget.dataset.item.id
      let index = e.currentTarget.dataset.index
      let n = e.currentTarget.dataset.item.is_agree//是否点赞，没点赞0，点过赞1
      if(n==1){
        this.setData({
          isLike:true
        })
      }else if(n==0){
          this.setData({
            isLike:false
          })
      }
      wx.showLoading({
        title: '加载中...',
      })
      this.data.isLike = !this.data.isLike
      let that = this
      util.request({
        url: config.apiUrl + '/hrloo.php?m=questions&c=index&a=ajax_zan',
        method: "POST",
        withSessionKey: true,
        autoHideLoading: false,

        data: {
          id: id
        }
      }).then(res => {
        wx.hideLoading()

        console.log('ressssss',res)
          const parms = {
            formid: formId
          }
          util.request({
            url: config.apiUrl + '/hr/special/wxapp/save_formid_cache ',
            method: "POST",
            data: parms,
            autoHideLoading: false,

            withSessionKey: true
          }).then(res => {
            console.log("搜集formid", formId)
          })
        if (res.result == 0) {

          //点赞成功
          wx.showToast({
            title: res.msg,
          })
         let zanCount = Number(this.data.plList[index].zan_count)
          ++zanCount

          this.data.plList[index].is_agree = '1'
          this.data.plList[index].zan_count = zanCount
          // this.triggerEvent('updateLike', {
          //   isLike : true
          // })
          this.setData({
            plList:this.data.plList
          })

        }else{
          wx.showToast({
            title: res.msg,
            icon:'none'
          })
        }
      }).catch(err=>{
        Error(err)
      })
    }, 500),
  },
})