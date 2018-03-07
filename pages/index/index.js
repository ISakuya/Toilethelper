//index.js
//获取应用实例
var app = getApp()
let amapFile = require('/../libs/amap-wx.js')
Page({
  data: {
    Height: 0,
    hidemap: 'block',
    latitude: "",
    longitude: "",
    markers: [],
    floors: [],
    selected: 0,
    states: [[4,4,4]],
    selectedMarker: -1,
    floorHint: [],
    inBuilding: 0,
    controls: [
      //三种拥挤程度图示
      {
        id: 1,
        iconPath: '/assets/imgs/level.png',
        position: {
          left: 305,
          top: 56,
          width: 54,
          height: 54
        },
        clickable: false
      }
    ]
  },
  getSensor: function (floor, buildingId){
    let _this = this;
    let markerToShow = [];
    for (let i = 0;i < _this.data.sensors.length;i++){
      let sensor = _this.data.sensors[i];
      if (sensor.floor != floor || sensor.buildingid != buildingId) continue;
      let marker = {};
      marker.id = sensor.id;
      marker.longitude = sensor.longitude;
      marker.latitude = sensor.latitude;
      marker.width = 50;
      marker.height = 60.2;
      marker.iconPath = '/assets/imgs/toilet_icon.png';
      markerToShow.push(marker);
    }
    this.setData({
      markers: markerToShow.concat(this.data.buildingMarkers),
      selectedMarker: markerToShow[0].id
    });
    //console.log(this.data.markers);
  },
  selectFloor: function(e){
    if (this.data.selected == 0)
      this.setData({
        selected: 1
      });
    this.getSensor(e.target.id[6],this.data.inBuilding);
    let temp = [];
    for (let i = 0; i < this.data.floor; i++) { temp[i] = ' '; }
    temp[e.target.id[6]-1] = 'floor-selected';
    this.setData({
      floorHint: temp
    })
    //console.log(e.target.id[6]);
    //console.log(this.data.floorHint);
  },
  setFloors: function(){
    let temp = [];
    for(let i=this.data.topFloor;i >= this.data.bottomFloor;i--) temp.push(i);
    this.setData({floors: temp});
  },
  setState: function(){

  },
  tapUpButton: function(){
    if (this.data.topFloor == this.data.floor) return;
    this.setData({ topFloor: this.data.topFloor + 1, bottomFloor: this.data.bottomFloor + 1});
    this.setFloors();
  },
  tapBottomButton: function(){
    if (this.data.bottomFloor == 1) return;
    this.setData({ topFloor: this.data.topFloor - 1, bottomFloor: this.data.bottomFloor - 1 });
    this.setFloors();
  },
  goThere: function(){
    console.log(1);
    let longitude, latitude;
    for (let i in this.data.markers) {
      let marker = this.data.markers[i];
      if (marker.id == this.data.selectedMarker) {
        longitude = marker.longitude;
        latitude = marker.latitude;
      }
    }
    wx.openLocation({
      longitude: longitude,
      latitude: latitude
    });
  },
  bindInput: function(){
    wx.navigateTo({
      url: '/pages/search/search?q=1',
    })
    console.log(this.data.longitude + ',' + this.data.latitude);
  },
  showAlarmForm: function(){
    this.setData({ hidemap:'none' })
  },
  checkBuilding: function(){
    let distance = 0.00001;
    let bid = -1;
    for(let i in this.data.buildings){
      let building = this.data.buildings[i];
      let temp = Math.pow(building.longitude-this.data.longitude, 2) + 
                 Math.pow(building.latitude-this.data.latitude, 2);
      if (temp < distance) {
        distance = temp;
        bid = i;
      }
      this.setData({ inBuilding: bid });
      console.log(distance);
      console.log(this.data.inBuilding);
    }
  },
  onLoad: function () {
    let _this = this;
    
    wx.getSystemInfo({
      success: function (res) {
        //设置map宽度，根据当前设备宽高满屏显示
        _this.setData({
          view: {
            Height: res.windowHeight
          },
          floor: 4,
          bottomFloor: 1,
          toThereHeight: res.screenWidth*0.32
        });
        console.log(res.screenWidth);
      }
    });
    
    wx.getLocation({
      success: function (res) {
        console.log(res.longitude, res.latitude);
        _this.setData({
          longitude: 113.406142,
          latitude: 23.046279,
        });
      }
    });

    wx.request({
      url: 'https://tolfinder.applinzi.com/getBuilding.php',
      success: function (res) {
        _this.setData({ buildings: res.data });
       
        let buildingMarkers = [];
        //make building markers
        for (let i in _this.data.buildings) {
          let building = _this.data.buildings[i];
          let marker = {};
          marker.id = 'b' + building.id;
          marker.longitude = building.longitude;
          marker.latitude = building.latitude;
          marker.width = 20;
          marker.height = 20;
          marker.iconPath = '/assets/imgs/toilet_alert.gif';
          buildingMarkers.push(marker);
        }
        _this.setData({buildingMarkers: buildingMarkers});
        console.log(_this.data.buildingMarkers);

        console.log(_this.data.buildings);
        _this.checkBuilding();
        wx.request({
          url: 'https://tolfinder.applinzi.com/test.php',
          success: function (res) {
            let states = [];
            for (let i in _this.data.buildings) states[i] = [];
            for (let i = 0; i < res.data.length; i++)
              states[res.data[i].buildingid][res.data[i].floor - 1] = res.data[i].state;
            _this.setData({ sensors: res.data, states: states });
            console.log('ss',states);
            _this.getSensor(1, _this.data.inBuilding);
            let temp = [];
            for (let i = 0; i < _this.data.floor; i++) { temp[i] = ' '; }
            temp[0] = 'floor-selected';
            _this.setData({
              floorHint: temp
            })
          }
        });
      }
    });
    
    if (_this.data.floor < 3) _this.setData({ topFloor: _this.data.floor });
    else _this.setData({ topFloor: 3 });
    _this.setFloors();
    /*wx.chooseLocation({
      success: function(res) {
        console.log(res);
      },
    })*/
    this.mapCtx = wx.createMapContext('map', this);

    let amap = new amapFile.AMapWX({ key: '948dc43d12c4bdcf87d4246b41fc195f' });
    amap.getRegeo({
      success: function (data) {
        console.log(data);
      },
      fail: function (info) {
        //失败回调
        console.log(info)
      }
    })
  },
  onShow: function(){
    this.setData({
      longitude: app.globalData.searchLongitude,
      latitude: app.globalData.searchLatitude
    });
    if (app.globalData.searchLongitude){
      this.checkBuilding();
      this.getSensor(1, this.data.inBuilding);
    }
    
  },
  regionchange(e) {
    console.log("regionchange===" + e.type)
  },
  //点击markers
  markertap(e) {
    if (e.markerId[0] != 'b') this.setData({ selectedMarker: e.markerId });
    //console.log(e);
    else{
      let selectedBuilding = this.data.buildings[e.markerId[1]];
      this.setData({
          longitude: selectedBuilding.longitude,
          latitude: selectedBuilding.latitude,
          inBuilding: e.markerId[1]
       });
       console.log(this.data.longitude, this.data.latitude);
       this.getSensor(1, this.data.inBuilding);
    }
    //显示选项
    /*wx.showActionSheet({
      itemList: ["A"],
      success:function(res){
        console.log(res.tapIndex)
      },
      fail:function(res){
        console.log(res.errMsg)
      }
    })*/
  },
  //点击缩放按钮动态请求数据
  controltap(e) {
    let that = this;
    console.log("scale===" + this.data.scale)
    if (e.controlId === 2) {
      that.setData({
        scale: --this.data.scale
      })
    } else if (e.controlId === 3) {
      that.setData({
        scale: ++this.data.scale
      })
    }
  },
  getUserInfo: function (e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  formSubmit: function (e) {
    console.log('form发生了submit事件，携带数据为：', e.detail.value);
    this.setData({ hidemap: 'block' })
  },
  formReset: function () {
    console.log('form发生了reset事件')
  }
})
