const bcrypt = require('bcrypt');
const db = require('./config/database');
const dotenv = require('dotenv');
dotenv.config();

const seedAdminUsers = async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);

    const admins = [
        { name: 'Viktor', email: 'viktor@wasatradfallning.se', password: hashedPassword, role: 'admin' },
        { name: 'Rudolf', email: 'rudolf@wasatradfallning.se', password: hashedPassword, role: 'admin' },
    ];

    try {
        for (const admin of admins) {
            const [rows] = await db.query(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE email=email',
                [admin.name, admin.email, admin.password, admin.role]
            );
            console.log(`Seeded admin: ${admin.email}`);
        }
    } catch (error) {
        console.error('Error seeding admin users:', error.message);
    }
};

seedAdminUsers();
