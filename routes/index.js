var express = require('express');
var router = express.Router();
require("./public/seckill")(router);
module.exports = router;