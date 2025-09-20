const bcrypt = require('bcryptjs');
const { getConnection } = require('../config/database');

class User {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.email = data.email;
        this.password = data.password;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Crear nuevo usuario
    static async create(userData) {
        try {
            const { name, email, password } = userData;
            const pool = await getConnection();
            
            // Hash de la contraseña
            const hashedPassword = await bcrypt.hash(password, 10);

            const [result] = await pool.execute(`
                INSERT INTO users (name, email, password) 
                VALUES (?, ?, ?)
            `, [name, email, hashedPassword]);
            
            // Obtener el usuario creado
            const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [result.insertId]);
            return new User(rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // Buscar usuario por ID
    static async findById(id) {
        try {
            const pool = await getConnection();
            const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
            
            if (rows.length === 0) {
                return null;
            }
            
            return new User(rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // Buscar usuario por email
    static async findByEmail(email) {
        try {
            const pool = await getConnection();
            const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
            
            if (rows.length === 0) {
                return null;
            }
            
            return new User(rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // Verificar contraseña
    async comparePassword(candidatePassword) {
        try {
            return await bcrypt.compare(candidatePassword, this.password);
        } catch (error) {
            throw error;
        }
    }

    // Obtener datos públicos del usuario (sin contraseña)
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }

    // Actualizar usuario
    async update(updateData) {
        try {
            const { name, email } = updateData;
            const pool = await getConnection();
            
            await pool.execute(`
                UPDATE users 
                SET name = ?, email = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `, [name, email, this.id]);
            
            // Obtener el usuario actualizado
            return await User.findById(this.id);
        } catch (error) {
            throw error;
        }
    }

    // Eliminar usuario
    async delete() {
        try {
            const pool = await getConnection();
            await pool.execute('DELETE FROM users WHERE id = ?', [this.id]);
            return true;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = User;
