var express = require('express');
var path = require('path');
var app = express();
var bodyParser = require('body-parser') 
var router = require("./routes/index");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.use("/",router);
app.set("port",process.env.PORT || 6688)
app.listen(app.get("port"),function(){
    console.log('server start success,listen:'+app.get("port"))
})