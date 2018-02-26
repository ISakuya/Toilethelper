// pages/search.js
let amapFile = require('/../libs/amap-wx.js')
let app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
  
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let _this = this;
    wx.getLocation({
      success: function (res) {
        console.log(res.longitude, res.latitude);
        _this.setData({
          longitude: 113.405142,
          latitude: 23.047279,
        })
      }
    });
  },
  bindInput: function(e){
    let _this = this;
    let amap = new amapFile.AMapWX({ key: '948dc43d12c4bdcf87d4246b41fc195f' });
    let keywords = e.detail.value; 
    amap.getInputtips({
      keywords: keywords,
      location: this.data.longitude + ',' + this.data.latitude,
      success: function (data) {
        console.log(data);
        if (data && data.tips) {
          _this.setData({
            tips: data.tips
          });
        }
      }
    });
    console.log(tips);
  },
  bindSearch: function(e){
      console.log(e);
      app.globalData.searchLongitude = 1;
      app.globalData.searchLatitude = 1;
      wx.navigateBack({ });
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

})