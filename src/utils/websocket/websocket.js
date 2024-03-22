const logger = require("../../logger/logger");
const { setOnlineUser, getOnlineUsers, removeOnlineUser, removeAllOnlineUsers, getUniqueOnlineUsers, setConnectedUser, getConnectedUser, removeConnectedUser } = require("../redis-service");
const insightsService = require('../../module/insights/insights.service');
const executeQuery = require("../../db/connect");
const moment = require("moment");

const sendOnlineUsersCount = async (io) => {
    const uniqueOnlineUserIds = await getUniqueOnlineUsers();
    io.emit("online_users_count", { count: uniqueOnlineUserIds?.length });
}

module.exports.initializeWebsocketConnection = async (io, dbConnectionString) => {
    await removeAllOnlineUsers();
    io.on("connection", (socket) => {
        console.log('A user connected');
        socket.on("userId", async ({ userId }) => {
            await setConnectedUser(userId, socket.id);
            const currentDateTimestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
            const time = currentDateTimestamp;
            const query = ` 
              INSERT INTO "online_user_session" ("userID","action", "time") VALUES('${userId}','CONNECTED','${time}')
            `;
            try {
                await executeQuery(query, dbConnectionString);
            } catch (error) {
                console.log(error + "user has not disconnected");
            }

            await setOnlineUser(socket.id, userId);
            await sendOnlineUsersCount(io);
        });

        socket.on("get_online_users_count", async () => {
            await sendOnlineUsersCount(io);
        });

        socket.on("join", ({ room }) => {
            console.log("A user joined room - ", room);

            setTimeout(() => {
                socket.join(room);
                socket.emit("join:ack", `Joined room "${room}".`);
                const activity = `joined the room "${room}".`;
                socket.broadcast.to(room).emit("join:ack", activity);
            }, 0);
        });

        socket.on('disconnect', async () => {
            const userId = await removeConnectedUser(socket.id);
            if (userId) {
                await removeOnlineUser(socket.id);
                await sendOnlineUsersCount(io);
                const onlineUsers = await getOnlineUsers();
                const time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                const query = ` 
            INSERT INTO "online_user_session" ("userID","action", "time") VALUES('${userId}','DISCONNECTED','${time}') `;
                try {
                    await executeQuery(query, dbConnectionString);
                } catch (error) {
                    console.log(error + "user has not disconnected");
                }
            }
            console.log('A user disconnected');
        });
    });
};
