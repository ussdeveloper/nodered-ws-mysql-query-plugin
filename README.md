# Node-RED MySQL Query Plugin

Plugin do Node-RED umożliwiający wykonywanie zapytań SQL do bazy danych MySQL z obsługą WebSocket.

## Funkcjonalność

Plugin pozwala na:
- Wykonywanie zapytań SELECT, INSERT, UPDATE, DELETE
- Parametryzowane zapytania (prepared statements) 
- Asynchroniczne połączenia z bazą danych
- Obsługę błędów i statusów połączenia
- Integrację z WebSocket dla real-time komunikacji

## Instalacja

```bash
npm install node-red-contrib-mysql-query
```

## Konfiguracja

Node wymaga skonfigurowania parametrów połączenia z bazą danych:

- **Host**: Adres serwera MySQL (domyślnie: localhost)
- **Port**: Port serwera MySQL (domyślnie: 3306)  
- **Użytkownik**: Nazwa użytkownika MySQL
- **Hasło**: Hasło do bazy danych
- **Baza danych**: Nazwa bazy danych
- **Zapytanie SQL**: Domyślne zapytanie do wykonania

## Użycie

### Wejście (msg object)

- `msg.query` (string, opcjonalne) - Zapytanie SQL (nadpisuje konfigurację)
- `msg.params` (array, opcjonalne) - Parametry dla prepared statements
- `msg.payload` (any) - Dowolne dane wejściowe

### Wyjście (msg object)

- `msg.payload` (array) - Wyniki zapytania jako tablica obiektów
- `msg.fields` (array) - Informacje o polach wyniku  
- `msg.rowCount` (number) - Liczba zwróconych rekordów

## Przykłady

### Proste zapytanie SELECT
```javascript
msg.query = "SELECT * FROM users LIMIT 10";
return msg;
```

### Zapytanie z parametrami (bezpieczne)
```javascript
msg.query = "SELECT * FROM users WHERE active = ? AND role = ?";
msg.params = [1, 'admin'];
return msg;
```

### Zapytanie INSERT
```javascript
msg.query = "INSERT INTO users (name, email) VALUES (?, ?)";
msg.params = ['Jan Kowalski', 'jan@example.com'];
return msg;
```

## Bezpieczeństwo

⚠️ **Ważne**: Zawsze używaj parametryzowanych zapytań z `msg.params` aby uniknąć ataków SQL Injection.

## Rozwój

### Struktura projektu

```
├── package.json          # Konfiguracja NPM i metadane
├── mysql-query.js        # Główna logika backend 
├── mysql-query.html      # Interfejs użytkownika i dokumentacja
└── .github/
    └── copilot-instructions.md  # Instrukcje dla Copilot
```

### Miejsca do opisania funkcjonalności

1. **mysql-query.js** (linie 8-18) - Główny opis funkcjonalności
2. **mysql-query.html** (linie 1-10) - Opis interfejsu użytkownika  
3. **package.json** (linia 3) - Krótki opis w polu description

## Licencja

MIT
