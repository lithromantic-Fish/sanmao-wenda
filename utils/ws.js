let util = require('./util');
let config = require('../config');

// wx websocket 封装

class Socket {

  // wx.connectSocket({
  //   url: 'test.php',
  //   data:{
  //     x: '',
  //     y: ''
  //   },
  //   header:{ 
  //     'content-type': 'application/json'
  //   },
  //   protocols: ['protocol1'],
  //   method:"GET"
  // })

  constructor(options) {
    this.connected = false;

    // DEMO todo
    let defaults = {
      url: config.wsUrl,
      data: {
        // websocket授权使用
        // action: 'login',
        // token: util._getStorageSync('hauth')
      },
      header: { 'content-type': 'application/json' },
      // header: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },      
      protocols: [],
      method: "GET",
      // complete(cData) {
      //   console.log('WebSocket连接已完成!', cData);
      // },
      // success(res) {
      //   console.log('WebSocket连接成功！', res);
      // },
      // fail(err) {
      //   console.log('WebSocket连接失败！', err);
      // }
    };

    options = util.extend(true, defaults, options);

    options.data = JSON.stringify(options.data);

    if (!this.connected) {
      // 建立连接
      wx.connectSocket(options);
    }

    // 监听连接成功
    wx.onSocketOpen((res) => {
      console.log('WebSocket连接已打开！', res);
      this.connected = true;

      util.runFn(options.onSocketOpen, this, res);
    });

    // 监听连接断开
    wx.onSocketError((res) => {
      console.log('WebSocket连接打开失败，请检查！', res)
      this.connected = false;
    })

    // 监听连接关闭
    wx.onSocketClose((res) => {
      console.log('WebSocket 已关闭！', res)
      this.connected = false;
    });
  }

  /**
   * 发送消息, 只发送,不管结果
   * @param {*} data 
   */
  sendWhatever(data) {

    if (!this.connected) {
      console.log('not connected');
      return;
    }

    wx.sendSocketMessage({
      data: JSON.stringify(data)
    });
  }

  send(data) {
    return util.promisify(wx.sendSocketMessage, {
      data: JSON.stringify(data)
    }).then(res => {
      console.log(res);
      return util.Promise(res);
    });
  }

  onmessage(callback) {
    if (typeof (callback) != 'function')
      return;

    // 监听服务器消息
    wx.onSocketMessage((res) => {
      console.log('receiver: ', res);
      util.runFn(callback, this, res.data, res);
    });
  }

  /**
   * 关闭socket, 断开连接
   * @param {*} options 
   */
  close(options) {
    let defaults = {
      fail(err) {
        console.warn('ws close failed!', err);
      }
    };

    options = util.extend(true, {}, defaults, options);

    wx.closeSocket(options);
  }

  onclose(callback) {
    wx.onSocketClose((res) => {
      console.log('onclose(), WebSocket 已关闭！', res)
      this.connected = false;

      util.runFn(callback, this, res);
    });
  }
}

// const socket = new Socket('wss://socket.getweapp.com')

// export default socket
export default Socket;