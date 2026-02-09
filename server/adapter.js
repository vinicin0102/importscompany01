const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// Mapeamento de Arquivos para Tabelas
const TABLE_MAP = {
    'products.json': 'products',
    'categories.json': 'categories',
    'banners.json': 'banners',
    'settings.json': 'settings',
    'users.json': 'users'
};

const adapter = {
    // Leitura
    async read(filename) {
        if (supabase) {
            const table = TABLE_MAP[filename];
            if (!table) return [];

            try {
                const { data, error } = await supabase.from(table).select('*').order('id', { ascending: true });
                if (error) {
                    console.error(`Supabase Error (${table}):`, error.message);
                    return this.readLocal(filename); // Fallback se der erro
                }

                // Normalizar dados (settings é especial)
                if (table === 'settings') {
                    return data.length > 0 ? data[0].config : {};
                }

                return data;
            } catch (e) {
                console.error('Supabase Exception:', e);
                return this.readLocal(filename);
            }
        }
        return this.readLocal(filename);
    },

    readLocal(filename) {
        try {
            const filepath = path.join(__dirname, 'data', filename);
            return JSON.parse(fs.readFileSync(filepath, 'utf8'));
        } catch (error) {
            return filename === 'settings.json' ? {} : []; // Retorno vazio seguro
        }
    },

    // Escrita (Create/Update/Delete) - Implementar por caso de uso no index.js ou aqui
    // Como o index.js faz manipulação de array em memória, precisamos adaptar a lógica.
    // Vamos exportar o cliente supabase para uso direto no index.js
    client: supabase
};

module.exports = adapter;
