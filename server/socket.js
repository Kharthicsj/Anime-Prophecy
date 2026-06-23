import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './models/User.js';

let io;

export const initSocket = (server) => {
    const corsOrigins = process.env.NODE_ENV === 'production'
        ? [process.env.CLIENT_URL, 'https://animeprophecy.onrender.com']
        : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'https://animeprophecy.onrender.com', 'https://animeprophecy.com'];

    io = new Server(server, {
        cors: {
            origin: corsOrigins,
            credentials: true
        }
    });

    io.use(async (socket, next) => {
        try {
            let token = socket.handshake.auth.token;
            if (!token && socket.handshake.headers.cookie) {
                const cookies = socket.handshake.headers.cookie.split(';');
                const tokenCookie = cookies.find(c => c.trim().startsWith('token='));
                if (tokenCookie) {
                    token = tokenCookie.split('=')[1];
                }
            }
            if (!token || token === 'null' || token === 'undefined') {
                return next(new Error('Authentication error: No token'));
            }
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
            socket.userId = decoded.id;
            socket.sessionId = decoded.sessionId;
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', async (socket) => {
        if (socket.userId && socket.sessionId) {
            await User.updateOne(
                { _id: socket.userId, "sessions.sessionId": socket.sessionId },
                { 
                    $set: { 
                        "sessions.$.isOnline": true, 
                        "sessions.$.socketId": socket.id,
                        "sessions.$.lastActive": new Date()
                    } 
                }
            );
            socket.broadcast.emit('admin_status_change', { userId: socket.userId, sessionId: socket.sessionId, isOnline: true });
        }

        socket.on('disconnect', async () => {
            if (socket.userId && socket.sessionId) {
                await User.updateOne(
                    { _id: socket.userId, "sessions.sessionId": socket.sessionId },
                    { 
                        $set: { 
                            "sessions.$.isOnline": false, 
                            "sessions.$.lastActive": new Date()
                        } 
                    }
                );
                socket.broadcast.emit('admin_status_change', { userId: socket.userId, sessionId: socket.sessionId, isOnline: false });
            }
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
