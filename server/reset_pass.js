const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const password = 'admin123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error(err);
        return;
    }

    const usersFile = path.join(__dirname, 'data', 'users.json');
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));

    // Update admin user
    const adminUser = users.find(u => u.username === 'admin');
    if (adminUser) {
        adminUser.password = hash;
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
        console.log('Senha atualizada com sucesso para: ' + password);
        console.log('Novo Hash:', hash);
    } else {
        console.error('Usuário admin não encontrado');
    }
});
