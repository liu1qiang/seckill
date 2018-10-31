var redis = require("redis");
var fs = require("fs");
var skill_config = require("../../configs/skill_type");
var client = redis.createClient(skill_config.connect.port, skill_config.connect.host);
var Quota_all_num = skill_config.skill.quota_num;
var skill_type = skill_config.skill.skillType;
var hshkey = "skill" + skill_type;
var start_seckill_time = skill_config.skill.start_seckill_time;
var end_seckill_time = skill_config.skill.end_seckill_time;
/**
 * 秒杀活动
 * 采用redis的hash来存储名额抢夺成功的用户信息，利用hash还可以防止用户多次抢夺秒杀名额。
 */
module.exports = function (router) {
    //增加名额。
    router.post("/add_skill", function (req, res, next) {
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
                var user_id = req.body.uid;
                var rondom_num = parseInt((Math.random() * 100).toFixed(0));
                var action_uid = (parseInt(user_id) + rondom_num)
                if (action_uid % 3 == 0) {    //自定义用户抢夺成功规则。
                    fs.appendFileSync('D:/v3_log/cache_log/quota_log.txt', '成功抢到的用户id:' + user_id +
                        ',加的随机数为:' + rondom_num +
                        ',处理之后的用户id:' + action_uid + '\r\n');
                    client.HSET(hshkey, hshkey + '_' + user_id, JSON.stringify({ "userid": user_id }), function (err, data) {
                        if (err) {
                            return res.json({ msg: "connect redis fail", con: 0 })
                        }
                        console.log(`抢夺成功，还剩下${surplus_quota_num - 1} 个名额.`)
                        return res.json({ msg: "success", con: surplus_quota_num - 1 })
                    })
                }
                else {
                    console.log("未抢到")
                    fs.appendFileSync('D:/v3_log/cache_log/quota_log.txt', '未抢到的用户id:' + user_id +
                        ',加的随机数为:' + rondom_num +
                        ',处理之后的用户id:' + action_uid + '\r\n');
                    return res.json({ msg: "很遗憾，您未抢到本次资格" })
                }

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
            resArray = resArray.sort(function (a, b) { return a.userid - b.userid })
            return res.json({ msg: "success", num: resArray.length, datas: resArray })
        })
    })
}
