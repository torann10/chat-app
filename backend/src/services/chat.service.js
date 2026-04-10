import db from '../database/db.js';

export const saveMessage = (roomId, senderId, content) => {
  const stmt = db.prepare('INSERT INTO messages (room_id, sender_id, content) VALUES (?, ?, ?)');
  return stmt.run(roomId, senderId, content);
};

export const getMessagesByRoom = (roomId, limit = 50) => {
  const stmt = db.prepare(`
    SELECT m.*, u.username as sender_name 
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.room_id = ?
    ORDER BY m.created_at DESC
    LIMIT ?
  `);
  return stmt.all(roomId, limit).reverse();
};