import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import apiClient from '../../services/apiClient';
import useAuth from '../../hooks/useAuth';

const Icon = ({ d, size = 20 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d={d} />
    </svg>
);
const IcCheck = () => <Icon d="M20 6L9 17l-5-5" />;
const IcX = () => <Icon d="M18 6L6 18M6 6l12 12" />;
const IcDeviceDesktop = () => <Icon d="M4 6h16v10H4zm2 14h12" />;
const IcDeviceMobile = () => <Icon d="M7 4h10v16H7z" />;
const IcTrash = () => <Icon d="M3 6h18M8 6V4h8v2m-9 14h10V6H7z" />;
const IcBell = () => <Icon d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />;

const SecurityPanel = () => {
    const { user } = useAuth();
    const [admins, setAdmins] = useState([]);
    const [pendingAdmins, setPendingAdmins] = useState([]);
    const [socket, setSocket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bellOpen, setBellOpen] = useState(false);

    const fetchAdmins = useCallback(async () => {
        try {
            const res = await apiClient.get('/auth/admins');
            if (res.data.success) {
                setAdmins(res.data.data.admins);
                setPendingAdmins(res.data.data.pendingAdmins);
            }
        } catch (error) {
            console.error('Failed to fetch admins:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAdmins();

        const token = localStorage.getItem('token');
        const socketInstance = io(
            import.meta.env.VITE_API_URL || 'http://localhost:5000',
            {
                auth: { token },
                withCredentials: true,
                transports: ['websocket'],
                reconnection: true
            }
        );

        socketInstance.on('connect', () => {
            console.log('Socket connected for security panel');
        });

        socketInstance.on('new_admin_request', ({ user }) => {
            setPendingAdmins(prev => {
                if (prev.find(p => p._id === user.id)) return prev;
                return [...prev, { _id: user.id, username: user.username, email: user.email }];
            });
        });

        socketInstance.on('admin_approved', ({ user }) => {
            setPendingAdmins(prev => prev.filter(p => p._id !== user.id));
            fetchAdmins(); // Refresh to get sessions
        });

        socketInstance.on('admin_rejected', ({ userId }) => {
            setPendingAdmins(prev => prev.filter(p => p._id !== userId));
        });

        socketInstance.on('admin_status_change', ({ userId, sessionId, isOnline }) => {
            setAdmins(prev => prev.map(admin => {
                if (admin._id === userId) {
                    const updatedSessions = admin.sessions.map(sess =>
                        sess.sessionId === sessionId
                            ? { ...sess, isOnline, lastActive: new Date() }
                            : sess
                    );
                    return { ...admin, sessions: updatedSessions };
                }
                return admin;
            }));
        });

        socketInstance.on('session_terminated', ({ userId, sessionId }) => {
            setAdmins(prev => prev.map(admin => {
                if (admin._id === userId) {
                    return { ...admin, sessions: admin.sessions.filter(sess => sess.sessionId !== sessionId) };
                }
                return admin;
            }));
            if (user?.id === userId && user?.sessionId === sessionId) {
                window.location.href = '/admin/login';
            }
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [fetchAdmins, user]);

    const handleApprove = async (id) => {
        try {
            await apiClient.post(`/auth/approve/${id}`);
            // Optimistic update
            setPendingAdmins(prev => prev.filter(p => p._id !== id));
            fetchAdmins();
        } catch (e) {
            console.error('Failed to approve:', e);
        }
    };

    const handleReject = async (id) => {
        try {
            await apiClient.post(`/auth/reject/${id}`);
            setPendingAdmins(prev => prev.filter(p => p._id !== id));
        } catch (e) {
            console.error('Failed to reject:', e);
        }
    };

    const handleTerminate = async (userId, sessionId) => {
        if (!confirm('Are you sure you want to terminate this session?')) return;
        try {
            await apiClient.delete(`/auth/session/${userId}/${sessionId}`);
            // Optimistic update
            setAdmins(prev => prev.map(admin => {
                if (admin._id === userId) {
                    return { ...admin, sessions: admin.sessions.filter(sess => sess.sessionId !== sessionId) };
                }
                return admin;
            }));
        } catch (e) {
            console.error('Failed to terminate session:', e);
        }
    };

    return (
        <div style={{ maxWidth: '900px' }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
                <div>
                    <h2 style={{ margin: "0 0 0.25rem", fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>
                        Security & Access Control
                    </h2>
                    <p style={{ margin: 0, color: "#71717a", fontSize: "0.9rem" }}>
                        Manage admin users, monitor sessions, and handle access requests.
                    </p>
                </div>

                <div style={{ position: "relative" }}>
                    <button
                        onClick={() => setBellOpen(!bellOpen)}
                        style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            border: "1px solid #3f3f46",
                            background: "rgba(24,24,27,0.7)",
                            color: "#a1a1aa",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            position: "relative"
                        }}
                    >
                        <IcBell />
                        {pendingAdmins.length > 0 && (
                            <span style={{
                                position: "absolute",
                                bottom: 0,
                                right: 0,
                                width: "12px",
                                height: "12px",
                                borderRadius: "50%",
                                background: "#ef4444",
                                border: "2px solid #18181b"
                            }} />
                        )}
                    </button>

                    {bellOpen && pendingAdmins.length > 0 && (
                        <div style={{
                            position: "absolute",
                            top: "100%",
                            right: 0,
                            marginTop: "0.5rem",
                            width: "320px",
                            background: "#18181b",
                            border: "1px solid #3f3f46",
                            borderRadius: "12px",
                            padding: "1rem",
                            zIndex: 50,
                            boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
                        }}>
                            <h4 style={{ margin: "0 0 1rem", fontSize: "0.9rem", color: "#fff", fontWeight: 600 }}>
                                Pending Requests ({pendingAdmins.length})
                            </h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                {pendingAdmins.map(admin => (
                                    <div key={admin._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(9,9,11,0.5)", padding: "0.75rem", borderRadius: "8px", border: "1px solid #27272a" }}>
                                        <div style={{ overflow: "hidden", paddingRight: "0.5rem" }}>
                                            <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600, color: "#fff", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{admin.username}</p>
                                            <p style={{ margin: "0.1rem 0 0", fontSize: "0.75rem", color: "#a1a1aa", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{admin.email}</p>
                                        </div>
                                        <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                                            <button onClick={() => handleApprove(admin._id)} style={{ padding: "0.4rem 0.6rem", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#86efac", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>Accept</button>
                                            <button onClick={() => handleReject(admin._id)} style={{ padding: "0.4rem 0.6rem", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>Reject</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {bellOpen && pendingAdmins.length === 0 && (
                        <div style={{ position: "absolute", top: "100%", right: 0, marginTop: "0.5rem", width: "220px", background: "#18181b", border: "1px solid #3f3f46", borderRadius: "12px", padding: "1rem", zIndex: 50, textAlign: "center", color: "#a1a1aa", fontSize: "0.85rem", boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}>
                            No pending requests.
                        </div>
                    )}
                </div>
            </div>

            {/* Active Admins & Sessions */}
            <div style={{
                background: "rgba(24,24,27,0.7)",
                border: "1px solid #27272a",
                borderRadius: "14px",
                padding: "1.5rem"
            }}>
                <h3 style={{ margin: "0 0 1.25rem", fontSize: "1rem", fontWeight: 700, color: "#fff" }}>
                    Active Admins & Sessions
                </h3>

                {loading ? (
                    <p style={{ color: '#71717a' }}>Loading sessions...</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {admins.map(admin => (
                            <div key={admin._id} style={{
                                background: 'rgba(9,9,11,0.5)',
                                borderRadius: '10px',
                                border: '1px solid #3f3f46',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    padding: '1rem',
                                    borderBottom: '1px solid #3f3f46',
                                    background: 'rgba(24,24,27,0.9)'
                                }}>
                                    <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: '1rem' }}>{admin.username}</p>
                                    <p style={{ margin: '0.2rem 0 0', color: '#a1a1aa', fontSize: '0.85rem' }}>{admin.email}</p>
                                </div>
                                <div style={{ padding: '1rem' }}>
                                    <p style={{ margin: '0 0 1rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#71717a' }}>Active Sessions ({admin.sessions?.length || 0})</p>

                                    {admin.sessions?.length === 0 ? (
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#52525b' }}>No active sessions.</p>
                                    ) : (
                                        <div style={{ display: 'grid', gap: '1rem' }}>
                                            {admin.sessions?.map(session => (
                                                <div key={session.sessionId} style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '1rem',
                                                    background: '#18181b',
                                                    borderRadius: '8px',
                                                    border: '1px solid #27272a'
                                                }}>
                                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                        <div style={{ color: '#a855f7' }}>
                                                            {session.deviceType === 'Mobile' ? <IcDeviceMobile /> : <IcDeviceDesktop />}
                                                        </div>
                                                        <div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                                                <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                                                                    {session.os} - {session.browser}
                                                                </span>
                                                                {session.isOnline ? (
                                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: '#86efac', background: 'rgba(34,197,94,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                                                        <span style={{ width: '6px', height: '6px', background: '#4ade80', borderRadius: '50%' }} /> Online
                                                                    </span>
                                                                ) : (
                                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: '#a1a1aa', background: 'rgba(161,161,170,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                                                        <span style={{ width: '6px', height: '6px', background: '#71717a', borderRadius: '50%' }} /> Offline
                                                                    </span>
                                                                )}
                                                                {session.sessionId === user?.sessionId && (
                                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: '#a855f7', background: 'rgba(168,85,247,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                                                                        This Device
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#71717a' }}>
                                                                Type: {session.deviceType} • IP: {session.ipAddress} • Logged in: {new Date(session.loginTime).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => handleTerminate(admin._id, session.sessionId)}
                                                        title="Terminate Session"
                                                        style={{
                                                            padding: '0.5rem',
                                                            borderRadius: '8px',
                                                            background: 'rgba(239,68,68,0.1)',
                                                            border: '1px solid rgba(239,68,68,0.2)',
                                                            color: '#fca5a5',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        <IcTrash />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SecurityPanel;
