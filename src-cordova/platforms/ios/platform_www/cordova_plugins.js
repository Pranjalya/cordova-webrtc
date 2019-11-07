cordova.define('cordova/plugin_list', function(require, exports, module) {
  module.exports = [
    {
      "id": "cordova-plugin-health.HealthKit",
      "file": "plugins/cordova-plugin-health/www/ios/HealthKit.js",
      "pluginId": "cordova-plugin-health",
      "clobbers": [
        "window.plugins.healthkit"
      ]
    },
    {
      "id": "cordova-plugin-health.health",
      "file": "plugins/cordova-plugin-health/www/ios/health.js",
      "pluginId": "cordova-plugin-health",
      "clobbers": [
        "navigator.health"
      ]
    },
    {
      "id": "cordova-plugin-camera.Camera",
      "file": "plugins/cordova-plugin-camera/www/CameraConstants.js",
      "pluginId": "cordova-plugin-camera",
      "clobbers": [
        "Camera"
      ]
    },
    {
      "id": "cordova-plugin-camera.CameraPopoverOptions",
      "file": "plugins/cordova-plugin-camera/www/CameraPopoverOptions.js",
      "pluginId": "cordova-plugin-camera",
      "clobbers": [
        "CameraPopoverOptions"
      ]
    },
    {
      "id": "cordova-plugin-camera.camera",
      "file": "plugins/cordova-plugin-camera/www/Camera.js",
      "pluginId": "cordova-plugin-camera",
      "clobbers": [
        "navigator.camera"
      ]
    },
    {
      "id": "cordova-plugin-camera.CameraPopoverHandle",
      "file": "plugins/cordova-plugin-camera/www/ios/CameraPopoverHandle.js",
      "pluginId": "cordova-plugin-camera",
      "clobbers": [
        "CameraPopoverHandle"
      ]
    },
    {
      "id": "cordova-call.CordovaCall",
      "file": "plugins/cordova-call/www/CordovaCall.js",
      "pluginId": "cordova-call",
      "clobbers": [
        "cordova.plugins.CordovaCall"
      ]
    },
    {
      "id": "cordova-plugin-android-permissions.Permissions",
      "file": "plugins/cordova-plugin-android-permissions/www/permissions-dummy.js",
      "pluginId": "cordova-plugin-android-permissions",
      "clobbers": [
        "cordova.plugins.permissions"
      ]
    },
    {
      "id": "es6-promise-plugin.Promise",
      "file": "plugins/es6-promise-plugin/www/promise.js",
      "pluginId": "es6-promise-plugin",
      "runs": true
    },
    {
      "id": "cordova-plugin-device.device",
      "file": "plugins/cordova-plugin-device/www/device.js",
      "pluginId": "cordova-plugin-device",
      "clobbers": [
        "device"
      ]
    }
  ];
  module.exports.metadata = {
    "cordova-plugin-whitelist": "1.3.4",
    "cordova-plugin-health": "1.1.3",
    "cordova-plugin-camera": "4.1.0",
    "cordova-call": "1.1.6",
    "cordova-plugin-android-permissions": "1.0.2",
    "es6-promise-plugin": "4.2.2",
    "cordova-plugin-compat": "1.2.0",
    "cordova-plugin-websocket": "0.12.2",
    "cordova-plugin-device": "2.0.3"
  };
});