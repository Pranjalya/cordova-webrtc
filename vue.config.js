module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ?
    '/cordova-webrtc/' :
    '/',
  pluginOptions: {
    cordovaPath: 'src-cordova'
  }
}