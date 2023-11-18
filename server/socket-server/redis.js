//redis
var redis = require('redis')



var redisClient = redis.createClient({
	    host: '127.0.0.1',
	    port: 6379,
	    // password: 'cherry001'
})

redisClient.on("connect", function () {
  console.log("redis connected successfully!");
});
redisClient.on('error', function (err) {
  console.log('redis connect failed. ' ,err);
});
redisClient.on('reconnecting', (stats) => {
  console.log('redis reconnecting...', stats);
});

async function set(key, val) {
	try {
		await redisClient.set(key, JSON.stringify(val));
	} catch (err) {
		console.error(`Error setting value for key ${key}`, err);
	}
}


async function hSet(key,hashkey,hashval){
	if (typeof hashval === 'object') {
	    hashval = JSON.stringify(hashval)
	  }
	await redisClient.hmset(key,hashkey, hashval)
}

function hGet(key, hkey) {
	return new Promise((resolve, reject) => {
		client.hget(key, hkey, (err, res) => {
			if (err) {
				reject(err);
			}
			resolve(res);
		});
	});
}

async function hGetAll(key){
	const promise = new Promise((resolve,reject) => {
		redisClient.hgetall(key,function(err,val){
			if(err){
				reject(err)
				return
			}
			if(val == null){
				resolve(null)
				return
			}
			resolve(val)
		})
	})
	return promise
}

async function hDel(key,hashkey){
	await redisClient.hdel(key,hashkey)
}

async function del(key) {
	await redisClient.del(key);
}

// async function 

module.exports = {
	hSet,
	hGetAll,
	hDel,
	set,
	hGet
}