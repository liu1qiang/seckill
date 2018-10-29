var redis = require("redis");
var async = require("async");
var skill_config = require("../../configs/skill_type");
var client = redis.createClient(skill_config.connect.port, skill_config.connect.host);
var Quota_all_num = skill_config.skill.quota_num;
var skill_type = skill_config.skill.skillType;
var hshkey = "skill" + skill_type;
/**
 * 秒杀活动
 * 采用redis的hash来存储名额抢夺成功的用户信息，利用hash还可以防止用户多次抢夺秒杀名额。
 */
module.exports = function (router) {
    //获取当前已秒杀名额数量
    function get_hlen(callback) {
        client.hlen(hshkey, function (err, data) {
            if (err) {
                return res.json({ msg: "connect redis fail", con: 0 })
            }
            var existing_uota_num = data;
            if (data >= Quota_all_num) {
                console.log("名额已抢完，敬请期待下一轮活动吧。")
                callback('fail', 0);
            } else {
                var surplus_quota_num = Quota_all_num - existing_uota_num
                callback(null, surplus_quota_num)
            }
        })
    };
    //新增秒杀名额
    function isHset(last_quota_num, callback) {
        client.HSET(hshkey, hshkey + '_' + last_quota_num, JSON.stringify({ "id": last_quota_num }), function (err, data) {
            if (err) {
                callback('fail', null);
            }
            console.log(`还剩下${last_quota_num - 1} 个名额.`)
            callback(null, last_quota_num - 1);
        })
    };
    //增加名额。
    router.post("/add_skill", function (req, res, next) {
        //利用async模块的瀑布流方法实现
        // async.waterfall([get_hlen, isHset], function (err, result) {
        //     if (err) {
        //         return res.json({ msg: "faill", con: 0 })
        //     } else {
        //         return res.json({ msg: "ok",con:result })
        //     }
        // })
        //直接按照正常流程操作redis
        client.hlen(hshkey, function (err, data) {
            if (err) {
                return res.json({ msg: "connect redis fail", con: 0 })
            }
            var existing_uota_num = data;
            if (data >= Quota_all_num) {
                console.log("名额已抢完，敬请期待下一轮活动吧。")
                return res.json({ msg: "faill", con: 0 })
            } else {
                //计算剩余名额
                var surplus_quota_num = Quota_all_num - existing_uota_num
                client.HSET(hshkey, hshkey + '_' + surplus_quota_num, JSON.stringify({ "id": surplus_quota_num }), function (err, data) {
                    if(err){
                        return res.json({ msg: "connect redis fail", con: 0 }) 
                    }
                    console.log(`还剩下${surplus_quota_num - 1} 个名额.`)
                    return res.json({ msg: "success", con: surplus_quota_num - 1 })
                })
            }
        })
    });
    //获取成功抢得名额的用户id
    router.get("/get_skill_quota", function (req, res, next) {
        client.HVALS("skill" + skill_type, function (err, data) {
            if (err) {
                return res.json({ msg: "connect redis fail", con: 0 })
            };
            if (data.length == 0) {
                return res.json({ msg: "success", datas: [] })
            };
            var resArray = [];
            for (var i = 0; i < data.length; i++) {
                resArray.push(JSON.parse(data[i]))
            }
            return res.json({ msg: "success", datas: resArray })
        })
    })
}
