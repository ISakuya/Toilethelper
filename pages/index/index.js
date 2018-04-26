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
    //左栏数组
    floors: [],
    //选择的楼层
    selected: 0,
    states: [[4,4,4]],
    //选择的传感器
    selectedMarker: -1,
    //操作左栏选中状态
    floorHint: [],
    //所在建筑物
    inBuilding: 0,
    buttonList: ['recommendButton', 'toThere', 'toiletAlert', 'locate'],
    buttonOpacity: [1,1,1,1],
    controls: [
      //三种拥挤程度图示
      {
        id: 1,
        iconPath: '/assets/imgs/level.gif',
        position: {
          left: 305,
          top: 56,
          width: 50,
          height: 83
        },
        clickable: false
      }
    ]
  },
  getSensor: function (buildingId, floor = 1, markerId = -1){
    //在地图上设置建筑物该层的传感器marker
    let _this = this;
    let markerToShow = [];
    let selectedMarker = -1;
    for (let i = 0;i < _this.data.sensors.length;i++){
      let sensor = _this.data.sensors[i];
      if (sensor.floor == floor && sensor.buildingid == buildingId){
        let marker = {};
        marker.id = sensor.id;
        marker.longitude = sensor.longitude;
        marker.latitude = sensor.latitude;
        marker.width = 40;
        marker.height = 63;
        marker.iconPath = '/assets/imgs/toilet' + sensor.state + '.png';
        marker.labelContent = sensor.label;
        selectedMarker = markerToShow.length;
        markerToShow.push(marker);
      }
      else if (sensor.floor == 1 && sensor.buildingid != buildingId){
          let marker = {};
          marker.id = sensor.id;
          marker.longitude = sensor.longitude;
          marker.latitude = sensor.latitude;
          marker.width = 20;
          marker.height = 20;
          marker.iconPath = '/assets/imgs/toilet.gif';
          markerToShow.push(marker);
        }
      }
    if (selectedMarker != -1){
      let labelContent = markerToShow[selectedMarker].labelContent;
      markerToShow[selectedMarker].callout = { content: labelContent, borderWidth: 1, borderColor: '#000000', bgColor: '#ffffff', padding: 4, borderRadius: 5, fontsize: 36, display: "ALWAYS"  };
      if (markerId != -1) selectedMarker = markerId;
      else selectedMarker = markerToShow[selectedMarker].id;
      console.log('selected Marker: ', selectedMarker);
    }
    let temp = [];
    for (let i in this.data.buildingMarkers)
      if (this.data.buildingMarkers[i].id != 'b' + buildingId) temp.push(this.data.buildingMarkers[i]);
    this.setData({
      markers: markerToShow.concat(temp),
      selectedMarker: selectedMarker
    });
    //console.log(this.data.markers);
  },
  selectFloor: function(e){
    //选择楼层动作
    this.getSensorData();
    if (this.data.selected == 0)
      this.setData({
        selected: 1
      });
    this.getSensor(this.data.inBuilding, e.target.id[6]);
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
    for (let i = this.data.floor; i >= 1; i--) temp.push(i);
    this.setData({ floors: temp });
    console.log(this.data.floor);
  },
  toThere: function(){
    //到这儿去

    if (this.data.selectedMarker == -1) return;
    let longitude, latitude;
    for (let i in this.data.markers) {
      let marker = this.data.markers[i];
      if (marker.id == this.data.selectedMarker) {
        longitude = marker.longitude;
        latitude = marker.latitude;
        break;
      }
    }
    wx.openLocation({
      longitude: longitude,
      latitude: latitude
    });
  },
  bindInput: function(){
    //搜索动作
    wx.navigateTo({
      url: '/pages/search/search?q=1',
    })
    console.log(this.data.longitude + ',' + this.data.latitude);
  },
  showAlarmForm: function(){
    //点击提醒
    this.setData({ hidemap:'none' })
  },
  checkBuilding: function(){
    //检查最近建筑物
    let distance = 20000;
    let bid = -1;
    for(let i in this.data.buildings){
      let building = this.data.buildings[i];
      let temp = Math.pow(building.longitude-this.data.trueLongitude, 2) + 
                 Math.pow(building.latitude-this.data.trueLatitude, 2);
      if (temp < distance) {
        distance = temp;
        bid = i;
      }
      console.log("distance to " + i + ' is ' + temp);
      console.log("inBuilding is " + bid);
    }
    this.setData({ inBuilding: bid, floor: this.data.buildings[bid].floor,
    longitude: this.data.buildings[bid].longitude, latitude: this.data.buildings[bid].latitude});
  },
  getSensorData: function(){
    var _this = this;
    wx.request({
      url: 'https://tolfinder.applinzi.com/test.php',
      success: function (res) {
        let states = [];
        for (let i in _this.data.buildings) states[i] = [];
        for (let i = 0; i < res.data.length; i++)
          states[res.data[i].buildingid][res.data[i].floor - 1] = res.data[i].state;
        _this.setData({ sensors: res.data, states: states });
      }
    })
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
          toThereHeight: res.screenWidth*0.32
        });
        console.log(res.screenWidth);
      }
    });
    
    wx.getLocation({
      success: function (res) {
        console.log('当前位置： ' + res.longitude, res.latitude);
        _this.setData({
          trueLongitude: res.longitude,//113.406142,
          trueLatitude: res.latitude//23.046279
        });
      }
    });

    wx.login({
      success: function (res) {
        if (res.code) {
          //get openid
          wx.request({
            url: 'https://api.weixin.qq.com/sns/jscode2session?appid=wxf9d3461c275c0f04&secret=0403dc5e4f00742ff19d564c372c9b67&js_code='+res.code+'&grant_type=authorization_code',
            success:function(res){
              _this.setData({ openid: res.data.openid });
              //console.log(res.data.openid);
            }
          })
        } else {
          console.log('登录失败！' + res.errMsg)
        }
      }
    });

    wx.request({
      //获取building数据
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
          marker.width = 30;
          marker.height = 30;
          marker.iconPath = '/assets/imgs/building.gif';
          buildingMarkers.push(marker);
        }
        _this.setData(
          {buildingMarkers: buildingMarkers, 
          floor:res.data[0].floor}
        );
        _this.setFloors();

        console.log('markers: ', _this.data.buildingMarkers);
        console.log('buildings: ', _this.data.buildings);
        _this.checkBuilding();
        wx.request({
          url: 'https://tolfinder.applinzi.com/test.php',
          success: function (res) {
            let states = [];
            for (let i in _this.data.buildings) states[i] = [];
            for (let i = 0; i < res.data.length; i++)
              states[res.data[i].buildingid][res.data[i].floor - 1] = res.data[i].state;
            _this.setData({ sensors: res.data, states: states });

            _this.getSensor(_this.data.inBuilding);

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

    /*if (_this.data.floor < 3) _this.setData({ topFloor: _this.data.floor });
    else _this.setData({ topFloor: 3 });
    _this.setFloors();*/
    /*wx.chooseLocation({
      success: function(res) {
        console.log(res);
      },
    })*/
    this.mapCtx = wx.createMapContext('map', this);

    //useless
    let amap = new amapFile.AMapWX({ key: '948dc43d12c4bdcf87d4246b41fc195f' });
    amap.getRegeo({
      success: function (data) {
        console.log('amapGetRegeo: ' , data);
      },
      fail: function (info) {
        //失败回调
        console.log(info)
      }
    });
  },

  onShow: function(){
    //从搜索页返回时设置坐标为搜索时选中值
    this.setData({
      longitude: app.globalData.searchLongitude,
      latitude: app.globalData.searchLatitude
    });
    if (app.globalData.searchLongitude){
      this.checkBuilding();
      this.getSensor(this.data.inBuilding);
    }
    this.getSensorData();
  },
  //点击markers
  markertap(e) {
    if (e.markerId[0] != 'b'){
      let sid = e.markerId;
      let temp = this.data.markers;
      this.setData({ selectedMarker: -1 });
      for (let i in this.data.markers){
        let sensor = this.data.markers[i];
        if (sensor.id == sid){
          if (sensor.iconPath.length == 24){
            let labelContent = sensor.labelContent;
            temp[i].callout = { content: labelContent, borderWidth: 1, borderColor: '#000000', bgColor: '#ffffff', padding: 4, borderRadius: 5, fontsize: 36, display: "ALWAYS" }
            this.setData({ selectedMarker: e.markerId});
          }
        }
        else sensor.callout = {};
      }
      this.setData({ markers: temp });
      //console.log('selected Marker: ',this.data.selectedMarker);
    }
    else{
      let selectedBuilding = this.data.buildings[e.markerId[1]];
      let temp = [];
      for (let f = 0; f < selectedBuilding.floor; f++) temp[f] = '';
      temp[0] = 'floor-selected';
      this.setData({
        inBuilding: e.markerId[1],
        floor: selectedBuilding.floor,
        floorHint: temp
      });
      this.setFloors();
      this.getSensor(this.data.inBuilding);
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
    //提醒表单
    let _this = this;
    console.log('form发生了submit事件，携带数据为：', e.detail.value);
    this.setData({ hidemap: 'block' });
    let fid = e.detail.formId;
    wx.request({
      url: 'https://tolfinder.applinzi.com/message.php',
      data:{
        sid: _this.data.selectedMarker,
        oid: _this.data.openid,
        fid: fid
      },
      success: function (res) {
        //console.log(res);
      }
    });
    //console.log(e.detail.formId);
  },
  formReset: function () {
    this.setData({ hidemap: 'block' });
  },
  locate: function(e){
    this.mapCtx.moveToLocation();
    wx.getLocation({
      success: function (res) {
        console.log('当前位置： ' + res.longitude, res.latitude);
        this.setData({
          trueLongitude: res.longitude,
          trueLatitude: res.latitude
        });
      }
    });
  },
  locateToSensor: function(bid, sensor){
    this.getSensor(bid, sensor.floor, sensor.id);
    let floor = this.data.buildings[bid].floor;
    let temp = [];
    for (let f = 0;f<floor;f++) temp[f] = '';
    temp[sensor.floor - 1] = 'floor-selected';
    this.setData({
      longitude: sensor.longitude,
      latitude: sensor.latitude,
      inBuilding: bid,
      floor: floor,
      floorHint: temp
    });
    this.setFloors();
  },
  recommend: function(){
    let distance = 0.1;
    let bid = this.data.inBuilding;
    let distanceList = []
    for (let i in this.data.buildings) {
      let building = this.data.buildings[i];
      let temp = Math.pow(building.longitude - this.data.trueLongitude, 2) +
        Math.pow(building.latitude - this.data.trueLatitude, 2);
      
      distanceList.push([i, temp]);
    }
    distanceList.sort(function(a, b){ return a[1] > b[1] });
    console.log(this.data.states);
    for (let i in distanceList){
      let bid = distanceList[i][0];
      let yellow = []
      for(let j in this.data.sensors){
        let sensor = this.data.sensors[j];
        if (sensor.buildingid == bid){
          if (sensor.state == 0){
            this.locateToSensor(bid, sensor);
            return;
          }
          else if (sensor.state == 1){
            yellow = sensor;
          }
        }
      }
      if (yellow != []){
        this.locateToSensor(bid, yellow);
        return;
      }
    }
  },

  buttonsTS: function(e){
    
    let bid = this.data.buttonList.indexOf(e.target.id);
    console.log(bid);
    let temp = this.data.buttonOpacity.slice(0);
    temp[bid] = 0.7;
    this.setData({ buttonOpacity: temp });
    
  },
  buttonsTE: function (e) {
    let bid = this.data.buttonList.indexOf(e.target.id);
    console.log(bid);
    let temp = this.data.buttonOpacity.slice(0);
    temp[bid] = 1;
    this.setData({ buttonOpacity: temp })
  },

  test: function(e){
    console.log(e);
    wx.showToast('sssss');
  }
})
