const {hSet, hGetAll, hDel, set, hGet} = require('./redis')
const {getMsg, getParams} = require('./common')

const http = require('http')
var fs = require('fs');
var express = require('express');
const {log} = require('console');
var app = express();


//http server
app.use(express.static('./dist'));
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, Origin, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    if ('OPTIONS' === req.method) {
        res.sendStatus(200);
    } else {
		res.sendfile('./dist/index.html');  //路径根据自己文件配置
	}
});

var server = http.createServer(app)
//socket server
let io = require('socket.io')(server, {allowEIO3: true});

//自定义命令空间  nginx代理 /mediaServerWsUrl { http://xxxx:18080/socket.io/ }
// io = io.of('mediaServerWsUrl')

server.listen(18080, async () => {
    console.log('服务器启动成功 *:18080');
});


io.on('connection', async (socket) => {
    await onListener(socket)
});


const userMap = new Map() // user - > socket
const roomKey = "room:"
let type = "live"

/**
 * DB data
 * @author cherry
 * @param {Object} userId
 * @param {Object} roomId
 * @param {Object} nickname
 * @param {Object} pub
 */
async function getUserDetailByUid(userId, roomId, nickname, pub) {
    let res = JSON.stringify(({"userId": userId, "roomId": roomId, "nickname": nickname, "pub": pub}))
    return res
}

const notNull = (s) => {
    return s && s !== "null";
}

/**
 * 监听
 * @param {Object} s
 */
async function onListener(s) {
    let url = s.client.request.url
    console.log(url)
    let userId = getParams(url, 'userId')
    let roomId = getParams(url, 'roomId')
    let nickname = getParams(url, 'nickname')
    let pub = getParams(url, 'pub')
    type = getParams(url, 'type')

    console.log("room type: " + type);
    console.log("client uid：" + userId + " roomId: " + roomId + " 【" + nickname + "】online ")
    //user map
    userMap.set(userId, s)
    //room cache
    if (notNull(roomId) && notNull(type)) {
        console.log("key: " + roomKey + type + ':' + roomId);
        await hSet(roomKey + type + ':' + roomId, userId, await getUserDetailByUid(userId, roomId, nickname, pub))
        console.log("roomId", roomId)
        oneToRoomMany(roomId, getMsg('join', userId + ' join then room', 200, {userId: userId, nickname: nickname}))
    }

    s.on('msg', async (data) => {
        console.log("msg", data)
        await oneToRoomMany(roomId, data)
    });

    s.on('disconnect', () => {
        console.log("client uid：" + userId + " roomId: " + roomId + " 【" + nickname + "】 offline ")
        userMap.delete(userId)
        if (notNull(roomId) && notNull(type)) {
            hDel(roomKey + type + ':' + roomId, userId)
            oneToRoomMany(roomId, getMsg('leave', userId + ' leave the room ', 200, {
                userId: userId,
                nickname: nickname
            }))
        }
    });

    s.on('roomUserList', async (data) => {
        // console.log("roomUserList msg",data)
        s.emit('roomUserList', await getRoomOnlyUserList(data['roomId']))
    })
    s.on('call', (data) => {
        let targetUid = data['targetUid']
        oneToOne(targetUid, getMsg('call', "远程呼叫", 200, data))
    })
    s.on('candidate', (data) => {
        let targetUid = data['targetUid']
        oneToOne(targetUid, getMsg('candidate', "ice candidate", 200, data))
    })
    s.on('offer', (data) => {
        let targetUid = data['targetUid']
        oneToOne(targetUid, getMsg('offer', "rtc offer", 200, data))
    })
    s.on('answer', (data) => {
        let targetUid = data['targetUid']
        oneToOne(targetUid, getMsg('answer', "rtc answer", 200, data))
    })
    s.on('applyMic', (data) => {
        let targetUid = data['targetUid']
        oneToOne(targetUid, getMsg('applyMic', "apply mic", 200, data))
    })
    s.on('acceptApplyMic', (data) => {
        let targetUid = data['targetUid']
        oneToOne(targetUid, getMsg('acceptApplyMic', "acceptApplyMic mic", 200, data))
    })
    s.on('refuseApplyMic', (data) => {
        let targetUid = data['targetUid']
        oneToOne(targetUid, getMsg('refuseApplyMic', "refuseApplyMic mic", 200, data))
    })

    s.on('incrLikeStar', async (data) => {
        console.log(data['userId'] + " incr like star");
        let userId = data['userId'];
        let starType = data['starType'];
        let incr = data['incr'];
        await incrStar(userId, starType, incr);
    });

    s.on('setStreamInfo', async (data) => {
        console.log("set stream info");
        const streamId = data['streamId'];
        const streamingInfo = data['streamingInfo'];

        await setStreamInfo(streamId, streamingInfo);
    });

    s.on('getStreamInfo', async (data) => {
        const streamId = data['streamId'];
        return await getStreamInfo(streamId);
    });

    s.on('liveRooms', async () => {
        // 这里还应该做个分页
        console.log("get all live rooms..");
        s.emit('liveRooms', await getLiveRooms());
    });

}

/**
 * ono to one
 * @author cherry
 * @param {Object} uid
 * @param {Object} msg
 */
function oneToOne(uid, msg) {
    let s = userMap.get(uid)
    if (s) {
        s.emit('msg', msg)
    } else {
        console.log(uid + "用户不在线")
    }
}

/**
 * 获取房间用户列表(k-v) 原始KV数据
 * @author cherry
 * @param {Object} roomId
 */
async function getRoomUser(roomId) {
    return await hGetAll(roomKey + type + ':' + roomId)
}

/**
 * 获取房间用户列表(list)
 * @author cherry
 * @param {Object} roomId
 */
async function getRoomOnlyUserList(roomId) {
    let resList = []
    let uMap = await hGetAll(roomKey + type + ':' + roomId)
    for (const key in uMap) {
        let detail = JSON.parse(uMap[key])
        resList.push(detail);
    }
    return resList
}


/**
 * broadcast
 * @author suc
 * @param {Object} roomId
 * @param {Object} msg
 */
async function oneToRoomMany(roomId, msg) {
    let uMap = await getRoomUser(roomId)
    for (const uid in uMap) {
        oneToOne(uid, msg)
    }
}



const USER_STAR_PREFIX = 'user-stars:';

/**
 * increse star
 * @param userId
 * @param starType
 * @param incr
 * @returns {Promise<number>}
 */
async function incrStar(userId, starType, incr) {
    let userStars = await hGetAll(USER_STAR_PREFIX + userId)
    if (userStars) {
        let starCount = parseInt(userStars[starType] || '0')
        starCount += parseInt(incr || '0')
        await hSet(USER_STAR_PREFIX + userId, starType, starCount.toString())
        return starCount
    } else {
        await hSet(USER_STAR_PREFIX + userId, starType, '1')
        return 1
    }
}

const STREAM_INFO_PREFIX = roomKey + type + ':info:';

/**
 * set stream info <streamId, streamingInfo>
 * @param streamId
 * @param streamingInfo
 * @returns {Promise<void>}
 */
async function setStreamInfo(streamId, streamingInfo) {
    // if (streamingInfo.coverImage) {
        // 代替OSS上传图片的
        // const coverImageName = `${streamId}.jpg`;
        // const coverImageStream = fs.createReadStream(
        //     streamingInfo.coverImage.path
        // );
        // const coverImageResult = await uploadFile(
        //     coverImageName,
        //     coverImageStream
        // );
        // if (coverImageResult.statusCode !== 200) {
        //     throw new Error(
        //         `Failed to upload cover image, status code: ${coverImageResult.statusCode}`
        //     );
        // }
        // streamingInfo.coverImageUrl = coverImageResult.url;
    // }
    console.log(JSON.stringify(streamingInfo));
    await hSet( STREAM_INFO_PREFIX,  `${streamId}`, JSON.stringify(streamingInfo));
}

/**
 * get stream info by streamID
 * @param streamId
 * @returns {Promise<any>}
 */
// async function getStreamInfo(streamId) {
//     const streamInfoStr = await hGetAll(STREAM_INFO_PREFIX + `${streamId}`);
//     if (streamInfoStr == null) {
//         throw new Error(`Stream ${streamId} does not exist`);
//     }
//     return JSON.parse(streamInfoStr);
// }
function getStreamInfo(streamId) {
    return new Promise((resolve, reject) => {
        const hkey = STREAM_INFO_PREFIX + streamId;
        hGet(STREAM_INFO_PREFIX, hkey, (err, res) => {
            if (err) {
                reject(err);
            }
            const value = JSON.parse(res);
            resolve(value);
        });
    });
}

async function getLiveRooms() {
    return new Promise((resolve, reject) => {
        const streamInfos = [];
        hGetAll(STREAM_INFO_PREFIX, (err, res) => {
            if (err) {
                reject(err);
            }
            for (let hkey in res) {
                const value = JSON.parse(res[hkey]);
                streamInfos.push(value);
            }
            resolve(streamInfos);
        });
    });
}
