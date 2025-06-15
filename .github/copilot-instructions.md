<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Instrukcje dla Copilot - Plugin Node-RED MySQL Query

## Kontekst projektu
To jest plugin do Node-RED służący do wykonywania zapytań MySQL z obsługą WebSocket. Plugin składa się z trzech głównych plików:

1. **mysql-query.js** - główna logika backend
2. **mysql-query.html** - interfejs użytkownika i dokumentacja 
3. **package.json** - konfiguracja pakietu NPM

## Miejsca do opisania funkcjonalności

### 1. W pliku mysql-query.js
**Linie 8-18**: Główny komentarz opisujący funkcjonalność node'a
- Opis co robi plugin
- Jakie parametry konfiguracji obsługuje
- Jak działa z WebSocket

### 2. W pliku mysql-query.html
**Linie 1-10**: Komentarz opisujący interfejs użytkownika
**Linie 47-54**: Funkcja oneditprepare - walidacja i inicjalizacja
**Linie 59-64**: Funkcja oneditsave - zapisywanie konfiguracji  
**Linie 69-74**: Funkcja oneditcancel - anulowanie edycji
**Linie 77-82**: Opis szablonu HTML
**Linie 104-108**: Sekcja dokumentacji pomocy

### 3. W pliku package.json
**Linia 3**: Pole "description" - krótki opis funkcjonalności
**Linie 6-12**: Słowa kluczowe opisujące plugin

## Konwencje kodowania
- Używaj komentarzy JSDoc dla funkcji
- Komentarze w języku polskim
- Obsługa błędów z odpowiednimi komunikatami
- Status node'a pokazuje aktualny stan operacji

## Bezpieczeństwo
- Zawsze używaj prepared statements
- Waliduj dane wejściowe
- Nie loguj haseł w kodzie
