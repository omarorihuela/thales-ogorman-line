/* 
    ** This is the cofiguration to connect
        with SQL Server and with THALES_L_TAMAYO
        database. **
*/
const dbConfig = {
    server : 'localhost\\SQLEXPRESS',
    database : 'THALES_L_VELASCO',
    user : 'sa',
    password : 'qwerty',
    port: 1433,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 1000
    }
}

module.exports = dbConfig;