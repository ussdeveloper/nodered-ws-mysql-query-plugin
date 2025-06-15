# Opis funkcjonalności - Plugin Node-RED MySQL Query

## 📋 Przegląd funkcjonalności

Plugin `node-red-contrib-mysql-query` umożliwia bezpieczne wykonywanie zapytań SQL do bazy danych MySQL z poziomu Node-RED. Plugin został zaprojektowany z myślą o bezpieczeństwie, wydajności i łatwości użycia.

## 🎯 Główne funkcje

### 1. **Wykonywanie zapytań SQL**
- Obsługa wszystkich typów zapytań: SELECT, INSERT, UPDATE, DELETE
- Asynchroniczne wykonywanie zapytań
- Automatyczne zamykanie połączeń
- Obsługa transakcji

### 2. **Bezpieczeństwo**
- **Prepared Statements** - zabezpieczenie przed SQL Injection
- Parametryzowane zapytania przez `msg.params`
- Walidacja danych wejściowych
- Bezpieczne przechowywanie haseł

### 3. **Zarządzanie połączeniami**
- Automatyczne nawiązywanie połączeń
- Pooling połączeń (opcjonalnie)
- Obsługa timeoutów
- Monitorowanie stanu połączenia

### 4. **Interfejs użytkownika**
- Intuicyjny formularz konfiguracyjny
- Edytor SQL z podświetlaniem składni
- Walidacja pól w czasie rzeczywistym
- Pomoc kontekstowa

## 📊 Dane wejściowe i wyjściowe

### **Wejście (msg object)**
```javascript
{
  payload: any,           // Dowolne dane (opcjonalne)
  query: "SELECT * FROM users WHERE id = ?",  // Zapytanie SQL (opcjonalne)
  params: [123],          // Parametry zapytania (opcjonalne)
  timeout: 30000          // Timeout w ms (opcjonalne)
}
```

### **Wyjście (msg object)**
```javascript
{
  payload: [...],         // Wyniki zapytania jako tablica
  fields: [...],          // Metadane pól
  rowCount: 5,           // Liczba zwróconych rekordów
  affectedRows: 1,       // Liczba zmienionych rekordów (INSERT/UPDATE/DELETE)
  insertId: 123,         // ID nowo wstawionego rekordu
  executionTime: 45      // Czas wykonania zapytania w ms
}
```

## ⚙️ Konfiguracja

### **Parametry połączenia**
- **Host** - Adres serwera MySQL (domyślnie: localhost)
- **Port** - Port serwera (domyślnie: 3306)
- **Użytkownik** - Nazwa użytkownika MySQL
- **Hasło** - Hasło do bazy danych
- **Baza danych** - Nazwa bazy danych
- **Zapytanie SQL** - Domyślne zapytanie

### **Opcje zaawansowane**
- **Timeout połączenia** - Maksymalny czas oczekiwania
- **Retry count** - Liczba prób ponownego połączenia
- **SSL** - Szyfrowane połączenie
- **Charset** - Kodowanie znaków (domyślnie: utf8mb4)

## 🔧 Przykłady użycia

### **1. Proste zapytanie SELECT**
```javascript
// W node'ie function przed mysql-query
msg.query = "SELECT id, name, email FROM users LIMIT 10";
return msg;
```

### **2. Zapytanie z parametrami (bezpieczne)**
```javascript
// Wyszukiwanie użytkownika po ID
msg.query = "SELECT * FROM users WHERE id = ? AND active = ?";
msg.params = [123, 1];
return msg;
```

### **3. Wstawianie nowego rekordu**
```javascript
// Dodawanie nowego użytkownika
msg.query = "INSERT INTO users (name, email, created_at) VALUES (?, ?, NOW())";
msg.params = ["Jan Kowalski", "jan@example.com"];
return msg;
```

### **4. Aktualizacja danych**
```javascript
// Aktualizacja profilu użytkownika
msg.query = "UPDATE users SET last_login = NOW() WHERE id = ?";
msg.params = [msg.payload.userId];
return msg;
```

### **5. Usuwanie rekordów**
```javascript
// Usuwanie nieaktywnych użytkowników
msg.query = "DELETE FROM users WHERE active = 0 AND last_login < DATE_SUB(NOW(), INTERVAL 1 YEAR)";
return msg;
```

## 🛡️ Bezpieczeństwo

### **Najlepsze praktyki**
1. **Zawsze używaj prepared statements**
   ```javascript
   // ✅ DOBRZE - bezpieczne
   msg.query = "SELECT * FROM users WHERE email = ?";
   msg.params = [userEmail];
   
   // ❌ ŹLE - podatne na SQL Injection
   msg.query = "SELECT * FROM users WHERE email = '" + userEmail + "'";
   ```

2. **Waliduj dane wejściowe**
   ```javascript
   // Sprawdź czy parametry są prawidłowe
   if (!msg.params || !Array.isArray(msg.params)) {
       msg.params = [];
   }
   ```

3. **Używaj najmniejszych uprawnień**
   - Twórz dedykowanego użytkownika MySQL
   - Przydziel tylko niezbędne uprawnienia
   - Unikaj konta root w produkcji

## 📈 Monitoring i debugging

### **Statusy node'a**
- 🔵 **Niebieski** - Łączenie z bazą danych
- 🟢 **Zielony** - Zapytanie wykonane pomyślnie
- 🔴 **Czerwony** - Błąd połączenia lub zapytania
- 🟡 **Żółty** - Ostrzeżenie lub timeout

### **Typowe błędy i rozwiązania**

| Błąd | Przyczyna | Rozwiązanie |
|------|-----------|-------------|
| `Connection refused` | Nieprawidłowy host/port | Sprawdź adres serwera MySQL |
| `Access denied` | Błędne dane logowania | Zweryfikuj użytkownika i hasło |
| `Unknown database` | Baza nie istnieje | Utwórz bazę lub popraw nazwę |
| `Table doesn't exist` | Tabela nie istnieje | Sprawdź nazwę tabeli w zapytaniu |
| `SQL syntax error` | Błąd składni SQL | Zweryfikuj zapytanie SQL |

## 🔄 Integracja z WebSocket

Plugin może współpracować z WebSocket dla real-time komunikacji:

### **Przykład - Live dashboard**
```javascript
// Node function przed mysql-query
msg.query = "SELECT COUNT(*) as active_users FROM users WHERE last_seen > DATE_SUB(NOW(), INTERVAL 5 MINUTE)";

// Node function po mysql-query
if (msg.payload && msg.payload[0]) {
    // Wyślij dane przez WebSocket
    msg.payload = {
        type: "user_count",
        count: msg.payload[0].active_users,
        timestamp: new Date()
    };
}
return msg;
```

## 🚀 Wydajność

### **Optymalizacja zapytań**
- Używaj indeksów na często przeszukiwanych kolumnach
- Ograniczaj wyniki przez LIMIT
- Unikaj SELECT * w produkcji
- Wykorzystuj cache'owanie wyników

### **Zarządzanie pamięcią**
- Plugin automatycznie zwalnia zasoby
- Unikaj bardzo dużych wyników (>1000 rekordów)
- Rozważ paginację dla dużych zbiorów danych

## 📝 Rozwój i rozszerzenia

### **Możliwe rozszerzenia**
1. **Connection pooling** - zarządzanie pulą połączeń
2. **Batch operations** - wykonywanie wielu zapytań naraz
3. **Schema validation** - walidacja struktury bazy
4. **Query caching** - cache'owanie wyników zapytań
5. **Audit logging** - logowanie wszystkich operacji

### **Hooks i eventy**
```javascript
// Przykład przyszłego API
node.on('beforeQuery', (query, params) => {
    // Preprocessing zapytania
});

node.on('afterQuery', (results, executionTime) => {
    // Post-processing wyników
});
```

## 📚 Dokumentacja API

### **Metody node'a**
- `executeQuery(sql, params)` - Wykonanie zapytania
- `testConnection()` - Test połączenia z bazą
- `getSchema()` - Pobranie schematu bazy danych
- `close()` - Zamknięcie wszystkich połączeń

### **Eventy**
- `connected` - Nawiązano połączenie
- `disconnected` - Utracono połączenie  
- `error` - Wystąpił błąd
- `queryExecuted` - Zapytanie wykonane

---

*Ostatnia aktualizacja: 15 czerwca 2025*
