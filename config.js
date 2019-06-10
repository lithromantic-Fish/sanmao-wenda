// api调用域名
const apiUrl = 'https://wxapi.hrloo.com';

// // 图片验证码地址
// const captchaUrl = apiUrl + '/hrloo56.php?m=api&c=index&a=verifycode';

// // 购买视频课地址
// const videoPayUrl = apiUrl + '/hrloo.php?m=uc&c=reward&a=wxapp_pay';

// websocket地址
// const wsUrl = 'ws://10.1.10.151:9292';
// const wsUrl = 'ws://10.1.10.158:9292';
// const wsUrl = 'ws://10.1.10.153:9292';
const wsUrl = 'wss://websocket.hrloo.com/chat';


// 三茅招聘基础信息配置文件
module.exports = {

  apiUrl: apiUrl,

  // 三茅招聘小程序静态资源存储位置
  staticUrl: 'http://static.hrloo.com/hrloo56/wendaminiapp/img',
  // captchaUrl: captchaUrl,
  // videoPayUrl: videoPayUrl,
  // staticVer: '20171023', // 静态资源版本号, 主要是图片, 暂时不用
  wsUrl: wsUrl,
  wsReConnectMax: 3, // ws断开重新连接最大次数, 避免陷入死循环
  // tabBarPages: ['pages/index/index', 'pages/my/my'],

  // 视频播放地址质量映射
  // 只是为了映射text
  // playUrlMapping: {
  // 	0: '标清',  // 原始
  // 	1: '高清',  // 标清
  // 	2: '超高清' // 高清
  // },

  // 邀请注册, api需要此值, 团购类型
  // 在注册时要传这个值进去
  // tgtype: 4,

  /**
   * 视频可播放状态映射
   * 0: 可正常播放
   * 1: 未登录
   * 2: 没有满足邀请人数条件
   * 3: 没到开播时间,
   * 4: 需要支付
   */
  // videoStatusMapping: {
  // 	canPlay: 0,
  // 	notLogin: 1,
  // 	notInviteFull: 2,
  // 	notStartTime: 3,
  // 	unpaid: 4,
  // 	noAuth: 5, // 无权限
  // },

  // videoTypeMapping: {
  // 	onDemand: 1, // 点播
  // 	live: 4, // 直播
  // },

  // 直播: 腾讯云视频id和地址映射
  // liveVideoIdUrlMapping: [
  // 	['10905947996153120742', 'https://2139.liveplay.myqcloud.com/live/2139_4a31d1a0b88411e792905cb9018cf0d4.m3u8'],
  // 	['16093104850681751699', 'https://2139.liveplay.myqcloud.com/live/2139_cc72edb4bf3811e5b91fa4dcbef5e35a.m3u8'],
  // 	['10905947996169983468', 'https://2139.liveplay.myqcloud.com/live/2139_7d3e242fbeac11e792905cb9018cf0d4.m3u8'],
  // 	['10905947996169985174', 'http://2139.liveplay.myqcloud.com/live/2139_ab6d1254beac11e792905cb9018cf0d4.m3u8'],
  // 	['16093104850681736317', 'http://2139.liveplay.myqcloud.com/live/2139_af457f219f1f11e5b91fa4dcbef5e35a.m3u8']
  // ],

  /**
   * 1.4中视频购买状态映射, 与1.3的合为一个映射, 废弃
   * 0:　需要支付
   * 1:　未登录
   * 2: 可以正常播放　
   */
  // videoStatusMapping2: {
  //   unpaid: 0,
  //   notLogin: 1,
  //   canPlay: 2,
  // },

  /**
   * 视频详情页面, 类型映射
   * 1: 需要邀请注册的, 1.3加
   * 2: 需要支付的: 1.4加
   */
  // videoSourceMapping: {
  // 	invite: 1,
  // 	pay: 2
  // },

  // testPlayUrls: [
  // 	'http://183.58.17.27/v.cctv.com/flash/mp4video6/TMS/2011/01/05/cf752b1c12ce452b3040cab2f90bc265_h264818000nero_aac32-1.mp4?wsrid_tag=5a1bab4b_qingdianxin23_1942-20331&wsiphost=local',
  // 	'http://183.58.17.27/v.cctv.com/flash/mp4video6/TMS/2011/01/05/cf752b1c12ce452b3040cab2f90bc265_h264818000nero_aac32-2.mp4?wsrid_tag=5a1bab4b_qingdianxin23_1942-20331&wsiphost=local',
  // 	'http://183.58.17.27/v.cctv.com/flash/mp4video6/TMS/2011/01/05/cf752b1c12ce452b3040cab2f90bc265_h264818000nero_aac32-3.mp4?wsrid_tag=5a1bab4b_qingdianxin23_1942-20331&wsiphost=local'
  // ],

  // 1: 下拉(最开始的实现方式), 2 上拉
  // videoMsgUpdateWay: 2,

  // 错误码映射
  ERR_MAPPING: {
    NOT_LOGIN: 100, // 未登录
    SESSION_KEY_EXPIRED: 999, // sessionKey过期
  },

  // 获取用户信息后存储在storage中的key值
  authorizationURL: '/pages/login/login',
  userinfoRawDataKey: 'rawUser'
};