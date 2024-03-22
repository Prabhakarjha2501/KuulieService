const createClient = require('redis').createClient;
const logger = require("../logger/logger");
const axios = require('axios')

const REDIS_URL = process.env.REDIS_URL;
const AUTH_API_URL = process.env.AUTH_API_URL;

if (!REDIS_URL) throw new Error('REDIS_URL is empty');

const client = createClient({
    url: REDIS_URL,
});

client.on('error', err => {
    logger.error('REDIS Error ' + err);
});

async function setCache(key, value) {
    if (!client.isOpen)
        await client.connect();
    return await client.set(key, JSON.stringify(value));
}

async function setExpirableCache(key, value, expirySeconds) {
    if (!client.isOpen)
        await client.connect();
    return await client.set(key, JSON.stringify(value), { EX: expirySeconds });
}

async function getCache(key) {
    if (!client.isOpen)
        await client.connect();
    const jsonString = await client.get(key);
    if (jsonString) {
        return JSON.parse(jsonString);
    }
}

async function getClientDataById(id) {
    let client = await getCache(id);
    if (!client) {
        await axios.get(`${AUTH_API_URL}/api/masters/build/cache/clients`);
        client = await getCache(id);
    }
    return client;
}

async function getUserAccessToken(userId) {
    const tokenKey = `AT_${userId}`;
    if (!client.isOpen)
        await client.connect();
    return await client.get(tokenKey);
}

async function getOnlineUsers() {
    const onlineUsersCacheKey = "ONLINE_USERS";
    return await getCache(onlineUsersCacheKey);
}

async function getUniqueOnlineUsers() {
    const onlineUsers = await getOnlineUsers();
    const onlineUserIds = Object.values(onlineUsers || {}) || [];
    const uniqueOnlineUserIds = [...new Set(onlineUserIds)];
    return uniqueOnlineUserIds;
}

async function setOnlineUser(socketId, userId) {
    const onlineUsersCacheKey = "ONLINE_USERS";
    if (!client.isOpen)
        await client.connect();
    const jsonString = await client.get(onlineUsersCacheKey);
    let onlineUsers = {};
    
    if (jsonString) {
        onlineUsers = JSON.parse(jsonString);
    }
    onlineUsers = {
        ...onlineUsers,
        [socketId]: userId
    }
    return await client.set(onlineUsersCacheKey, JSON.stringify(onlineUsers));
}

async function setConnectedUser(userId, socketId) {
    const connectedUserCacheKey = "CONNECTED";
    if (!client.isOpen)
       await client.connect();
    
    let connectedUsers = await getCache(connectedUserCacheKey) || {};
    connectedUsers[socketId] = userId;
    
    return await setCache(connectedUserCacheKey, connectedUsers);
}


async function removeConnectedUser(socketId) {
    const connectedUserCacheKey = "CONNECTED";
    if (!client.isOpen)
        await client.connect();
    
    let connectedUsers = await getCache(connectedUserCacheKey) || {};
    const userId = connectedUsers[socketId];
    delete connectedUsers[socketId];
    
    await setCache(connectedUserCacheKey, connectedUsers);
    
    return userId; 
}

async function removeOnlineUser(socketId) {
    const onlineUsersCacheKey = "ONLINE_USERS";
    if (!client.isOpen)
        await client.connect();
    const jsonString = await client.get(onlineUsersCacheKey);
    let onlineUsers = {};
    if (jsonString) {
        onlineUsers = JSON.parse(jsonString);
    }
    onlineUsers = {
        ...onlineUsers,
        [socketId]: undefined
    }
    return await client.set(onlineUsersCacheKey, JSON.stringify(onlineUsers));
}

async function removeAllOnlineUsers() {
    const onlineUsersCacheKey = "ONLINE_USERS";
    await setCache(onlineUsersCacheKey, {});
}

module.exports = {
    getCache: getCache,
    setCache: setCache,
    setExpirableCache: setExpirableCache,
    getClientDataById: getClientDataById,
    getUserAccessToken: getUserAccessToken,
    setOnlineUser: setOnlineUser,
    getOnlineUsers: getOnlineUsers,
    removeOnlineUser: removeOnlineUser,
    removeAllOnlineUsers: removeAllOnlineUsers,
    getUniqueOnlineUsers: getUniqueOnlineUsers,
    setConnectedUser:setConnectedUser,
    removeConnectedUser:removeConnectedUser
}