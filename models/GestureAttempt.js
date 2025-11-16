const { getConnection } = require('../config/database');

class GestureAttempt {
    constructor(data) {
        this.id = data.id;
        this.student_id = data.student_id;
        this.gesture_id = data.gesture_id;
        this.gesture_name = data.gesture_name;
        this.score = Number(data.score) || 0;
        this.confidence = data.confidence ? Number(data.confidence) : null;
        this.detected_label = data.detected_label || null;
        this.device_info = data.device_info ? (typeof data.device_info === 'string' ? JSON.parse(data.device_info) : data.device_info) : null;
        this.raw_data = data.raw_data ? (typeof data.raw_data === 'string' ? JSON.parse(data.raw_data) : data.raw_data) : null;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    toJSON() {
        return {
            id: this.id,
            studentId: this.student_id,
            gestureId: this.gesture_id,
            gestureName: this.gesture_name,
            sign: this.gesture_name, // Alias para compatibilidad
            score: this.score,
            confidence: this.confidence,
            detectedLabel: this.detected_label,
            deviceInfo: this.device_info,
            raw: this.raw_data,
            date: this.created_at,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }

    static async create(attemptData) {
        const {
            student_id,
            gesture_id,
            gesture_name,
            score = 0,
            confidence = null,
            detected_label = null,
            device_info = null,
            raw_data = null
        } = attemptData;

        const pool = await getConnection();
        const [result] = await pool.execute(
            `INSERT INTO gesture_attempts 
                (student_id, gesture_id, gesture_name, score, confidence, detected_label, device_info, raw_data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                student_id,
                gesture_id,
                gesture_name,
                score,
                confidence,
                detected_label,
                device_info ? JSON.stringify(device_info) : null,
                raw_data ? JSON.stringify(raw_data) : null
            ]
        );

        const [rows] = await pool.execute(
            `SELECT * FROM gesture_attempts WHERE id = ?`,
            [result.insertId]
        );

        return new GestureAttempt(rows[0]);
    }

    static async findByStudent(studentId) {
        const pool = await getConnection();
        const [rows] = await pool.execute(
            `SELECT * FROM gesture_attempts 
             WHERE student_id = ?
             ORDER BY created_at DESC`,
            [studentId]
        );

        return rows.map(row => new GestureAttempt(row));
    }

    static async findById(id) {
        const pool = await getConnection();
        const [rows] = await pool.execute(
            `SELECT * FROM gesture_attempts WHERE id = ?`,
            [id]
        );

        return rows.length > 0 ? new GestureAttempt(rows[0]) : null;
    }

    static async findAll(limit = 100, offset = 0) {
        const pool = await getConnection();
        const [rows] = await pool.execute(
            `SELECT * FROM gesture_attempts 
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        return rows.map(row => new GestureAttempt(row));
    }
}

module.exports = GestureAttempt;

