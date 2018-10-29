//引入redis
var redis = require("redis");
var config = require("./config");
//创建redis客户端
global.client = redis.createClient(config.port, config.host);
//连接错误处理
client.on("error", function (error) {
    console.log(error);
});

var getData = require("./getRedisData");
getData.getDatas("10004",function(data){
    var num = parseInt(data.roleId);
    console.log("0x"+num.toString(16).toLocaleUpperCase());
});
// getData.setDatas("field2","bar",function(data){
// console.log(data);
// });