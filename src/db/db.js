const { Sequelize } = require('sequelize');
require('dotenv').config();
 

// Create a new instance of Sequelize
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        dialect: 'mssql',
        host: process.env.DB_SERVER,
        port: 1433,
        dialectOptions: {
            options: {
                instanceName: process.env.DB_INSTANCE,
                encrypt: false,
                trustServerCertificate: true,
                requestTimeout: 30000,
                useUTC: false
            }
        },
        timezone: '+05:30',
        logging: (msg) => {
            console.log([SEQUELIZE ${new Date().toLocaleString('en-IN')}] ${msg});
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);
 
module.exports = sequelize;




