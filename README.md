# Rentals Mock API

Этот проект представляет собой Mock API для сервиса помощи студентам в поиске жилья в Ростове-на-Дону. Проект создан в образовательных целях для демонстрации работы с REST API и генерации тестовых данных.

> Основной репозиторий проекта - [клик](https://github.com/RGITHackathonFall2024/assistant)

## 🚀 Функциональность

- Генерация реалистичных объявлений о сдаче жилья
- Использование реальных адресов Ростова-на-Дону
- API для поиска и фильтрации объявлений
- Динамическая генерация placeholder изображений
- Интерактивная карта с отображением объектов
- Фильтрация по цене и количеству комнат
- Бесконечный скролл объявлений

## 📋 Требования

- Node.js 14+
- npm или yarn
- Доступ к интернету (для работы с OpenStreetMap API)

## 🛠 Установка

```bash
# Клонирование репозитория
git clone https://github.com/RGITHackathonFall2024/rentals
cd rentals

# Установка зависимостей
npm install

# Генерация тестовых данных
npm run generate

# Запуск сервера
npm start
```

## 📦 Структура проекта

```
student-housing-assistant/
├── package.json
├── generate-listings.js   # Скрипт генерации данных
├── server.js              # Express сервер
└── public/               
    └── index.html         # Фронтенд приложение
```

## 🔄 API Endpoints

### Получение списка объявлений
```http
GET /api/listings?page=1&limit=20&minPrice=10000&maxPrice=50000&minRooms=1&maxRooms=3
```

Параметры:
- `page` - номер страницы (по умолчанию: 1)
- `limit` - количество объявлений на странице (по умолчанию: 20)
- `minPrice` - минимальная цена
- `maxPrice` - максимальная цена
- `minRooms` - минимальное количество комнат
- `maxRooms` - максимальное количество комнат

### Получение конкретного объявления
```http
GET /api/listings/:id
```

### Получение placeholder изображения
```http
GET /api/placeholder/:width/:height
```

## 💡 Примеры использования

### Получение списка объявлений
```javascript
fetch('http://localhost:3000/api/listings?page=1&limit=20')
  .then(response => response.json())
  .then(data => console.log(data));
```

### Фильтрация по цене
```javascript
fetch('http://localhost:3000/api/listings?minPrice=20000&maxPrice=40000')
  .then(response => response.json())
  .then(data => console.log(data));
```

## 📜 Лицензия

CC0 Public Domain

## 🔗 Credits

Проект разработан при участии Claude (Anthropic) в качестве AI-ассистента для помощи на хакатоне.

Авторы:
- Claude (Anthropic) - AI Assistant
- Dmitry Pshennikov (not so cute) - Project Lead & Developer [telegram](https://t.me/pmnullsqd)

## 🙏 Благодарности

- OpenStreetMap за предоставление API для геоданных
- Faker.js за инструменты генерации данных
- Bootstrap команде за прекрасный UI фреймворк