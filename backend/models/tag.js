const sql = require('mssql');
const config = require('../db/sqlConfig');

const tagModel = {
    async getAll() {
        const pool = await sql.connect(config);
        const result = await pool.request().query('SELECT * FROM Tags');
        return result.recordset;
    },

    async getById(id) {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('Id', sql.UniqueIdentifier, id)
            .query('SELECT * FROM Tags WHERE Id = @Id');
        return result.recordset[0];
    },

    async getByType(type) {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('Type', sql.NVarChar, type)
            .query('SELECT * FROM Tags WHERE Type = @Type');
        return result.recordset;
    },

    async searchByName(name, type = null) {
        const pool = await sql.connect(config);
        const req = pool.request().input('Name', sql.NVarChar, name);
        const typeClause = type ? ' AND Type = @Type' : '';
        if (type) req.input('Type', sql.NVarChar, type);
        const result = await req.query(`SELECT * FROM Tags WHERE Name LIKE '%' + @Name + '%'${typeClause}`);
        return result.recordset;
    }

};

module.exports = tagModel;
