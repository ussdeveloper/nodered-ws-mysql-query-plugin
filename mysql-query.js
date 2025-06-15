module.exports = function(RED) {
    "use strict";
    
    const mysql = require('mysql2/promise');

    /**
     * Główna funkcja node'a MySQL Query
     * 
     * MIEJSCE DO OPISANIA FUNKCJONALNOŚCI:
     * Ten node pozwala na wykonywanie zapytań SQL do bazy danych MySQL.
     * Obsługuje połączenia asynchroniczne i może być używany z WebSocket.
     * 
     * Parametry konfiguracji:
     * - host: adres serwera MySQL
     * - port: port serwera MySQL (domyślnie 3306)
     * - user: nazwa użytkownika
     * - password: hasło
     * - database: nazwa bazy danych
     * - query: zapytanie SQL do wykonania
     */
    function MySQLQueryNode(config) {
        RED.nodes.createNode(this, config);
        
        const node = this;
        
        // Konfiguracja połączenia z bazy danych
        node.host = config.host;
        node.port = config.port || 3306;
        node.user = config.user;
        node.password = config.password;
        node.database = config.database;
        node.query = config.query;
        
        // Funkcja do tworzenia połączenia z bazą danych
        async function createConnection() {
            try {
                const connection = await mysql.createConnection({
                    host: node.host,
                    port: node.port,
                    user: node.user,
                    password: node.password,
                    database: node.database
                });
                return connection;
            } catch (error) {
                node.error("Błąd połączenia z bazą danych: " + error.message);
                throw error;
            }
        }
        
        // Główna logika przetwarzania wiadomości
        node.on('input', async function(msg, send, done) {
            // Używaj send i done dla kompatybilności z Node-RED 1.0+
            send = send || function() { node.send.apply(node, arguments); };
            done = done || function(error) { 
                if (error) {
                    node.error(error, msg);
                }
            };
            
            try {
                node.status({fill:"blue", shape:"dot", text:"łączenie..."});
                
                const connection = await createConnection();
                
                // Użyj zapytania z konfiguracji lub z wiadomości
                const queryToExecute = msg.query || node.query;
                
                if (!queryToExecute) {
                    throw new Error("Brak zapytania SQL do wykonania");
                }
                
                node.status({fill:"green", shape:"dot", text:"wykonywanie zapytania..."});
                
                // Wykonaj zapytanie
                const [rows, fields] = await connection.execute(queryToExecute, msg.params || []);
                
                // Zamknij połączenie
                await connection.end();
                
                // Przygotuj wiadomość wyjściową
                msg.payload = rows;
                msg.fields = fields;
                msg.rowCount = rows.length;
                
                node.status({fill:"green", shape:"dot", text:`sukces: ${rows.length} rekordów`});
                
                send(msg);
                done();
                
            } catch (error) {
                node.status({fill:"red", shape:"ring", text:"błąd: " + error.message});
                done(error);
            }
        });
        
        // Czyszczenie przy zamknięciu node'a
        node.on('close', function() {
            node.status({});
        });
    }
    
    // Rejestracja node'a w Node-RED
    RED.nodes.registerType("mysql-query", MySQLQueryNode);
};
