const { getConnection } = require('../config/database');

class Evaluation {
    constructor(data) {
        this.id = data.id;
        this.student_id = data.student_id;
        this.professor_id = data.professor_id;
        this.gesture_id = data.gesture_id;
        this.gesture_name = data.gesture_name;
        this.attempt_id = data.attempt_id;
        this.attempt_timestamp = data.attempt_timestamp;
        this.score = Number(data.score);
        this.comments = data.comments || null;
        this.status = data.status || 'completed';
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        this.student_name = data.student_name || null;
        this.professor_name = data.professor_name || null;
        this.student_email = data.student_email || null;
        this.professor_email = data.professor_email || null;
    }

    toJSON() {
        return {
            id: this.id,
            studentId: this.student_id,
            studentName: this.student_name,
            studentEmail: this.student_email,
            professorId: this.professor_id,
            professorName: this.professor_name,
            professorEmail: this.professor_email,
            gestureId: this.gesture_id,
            gestureName: this.gesture_name,
            attemptId: this.attempt_id,
            attemptTimestamp: this.attempt_timestamp,
            score: this.score,
            comments: this.comments,
            status: this.status,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }

    static async create(evaluationData) {
        const {
            student_id,
            professor_id,
            gesture_id = null,
            gesture_name,
            attempt_id = null,
            attempt_timestamp = null,
            score,
            comments = null,
            status = 'completed'
        } = evaluationData;

        const pool = await getConnection();
        const [result] = await pool.execute(
            `INSERT INTO evaluations 
                (student_id, professor_id, gesture_id, gesture_name, attempt_id, attempt_timestamp, score, comments, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                student_id,
                professor_id,
                gesture_id,
                gesture_name,
                attempt_id,
                attempt_timestamp,
                score,
                comments,
                status
            ]
        );

        const [rows] = await pool.execute(
            `SELECT e.*, 
                    s.name AS student_name,
                    s.email AS student_email,
                    p.name AS professor_name,
                    p.email AS professor_email
             FROM evaluations e
             INNER JOIN users s ON e.student_id = s.id
             INNER JOIN users p ON e.professor_id = p.id
             WHERE e.id = ?`,
            [result.insertId]
        );

        return new Evaluation(rows[0]);
    }

    static async findAll() {
        const pool = await getConnection();
        const [rows] = await pool.execute(
            `SELECT e.*, 
                    s.name AS student_name,
                    s.email AS student_email,
                    p.name AS professor_name,
                    p.email AS professor_email
             FROM evaluations e
             INNER JOIN users s ON e.student_id = s.id
             INNER JOIN users p ON e.professor_id = p.id
             ORDER BY e.created_at DESC`
        );

        return rows.map(row => new Evaluation(row));
    }

    static async findByStudent(studentId) {
        const pool = await getConnection();
        const [rows] = await pool.execute(
            `SELECT e.*, 
                    s.name AS student_name,
                    s.email AS student_email,
                    p.name AS professor_name,
                    p.email AS professor_email
             FROM evaluations e
             INNER JOIN users s ON e.student_id = s.id
             INNER JOIN users p ON e.professor_id = p.id
             WHERE e.student_id = ?
             ORDER BY e.created_at DESC`,
            [studentId]
        );

        return rows.map(row => new Evaluation(row));
    }

    static async findByProfessor(professorId) {
        const pool = await getConnection();
        const [rows] = await pool.execute(
            `SELECT e.*, 
                    s.name AS student_name,
                    s.email AS student_email,
                    p.name AS professor_name,
                    p.email AS professor_email
             FROM evaluations e
             INNER JOIN users s ON e.student_id = s.id
             INNER JOIN users p ON e.professor_id = p.id
             WHERE e.professor_id = ?
             ORDER BY e.created_at DESC`,
            [professorId]
        );

        return rows.map(row => new Evaluation(row));
    }
}

module.exports = Evaluation;

