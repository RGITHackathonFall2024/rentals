import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import sharp from 'sharp';
import NodeCache from 'node-cache';

const app = express();
const cache = new NodeCache({ stdTTL: 3600 }); // кэш на 1 час
const PORT = 3000;

// Swagger определение
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Базы Недвижимости',
            version: '1.0.0',
            description: 'API для управления объявлениями о недвижимости'
        },
        servers: [
            {
                url: `https://rentals.bethetka.ru`,
                description: 'Продакшн-сервер'
            },
            {
                url: `http://localhost:${PORT}`,
                description: 'Локальный сервер'
            }
        ],
        components: {
            schemas: {
                Listing: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Уникальный идентификатор объявления'
                        },
                        price: {
                            type: 'number',
                            description: 'Цена объекта недвижимости'
                        },
                        rooms: {
                            type: 'integer',
                            description: 'Количество комнат'
                        }
                        // Добавьте другие поля здесь
                    }
                },
                ListingsResponse: {
                    type: 'object',
                    properties: {
                        items: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/Listing'
                            },
                            description: 'Список объявлений'
                        },
                        total: {
                            type: 'integer',
                            description: 'Общее количество объявлений, соответствующих фильтрам'
                        },
                        page: {
                            type: 'integer',
                            description: 'Текущий номер страницы'
                        },
                        totalPages: {
                            type: 'integer',
                            description: 'Общее количество страниц'
                        }
                    }
                }
            }
        }
    },
    apis: ['./server.js'] // файлы с аннотациями
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use(cors());
app.use(express.static('public'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

let listings = [];

async function loadListings() {
    const data = await fs.readFile('./data/listings.json', 'utf-8');
    listings = JSON.parse(data);
}
loadListings();


// Генерация случайного цвета для фона
function getRandomColor() {
    const colors = [
        '#FF5733', '#33FF57', '#3357FF', '#FF33F5',
        '#33FFF5', '#F5FF33', '#FF3333', '#33FF33'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Генерация случайного текста для изображения
function getRandomText() {
    const texts = [
        'Квартира', 'Комната', 'Студия', 'Апартаменты',
        'Жильё', 'Дом', 'Аренда', 'Сдаётся'
    ];
    return texts[Math.floor(Math.random() * texts.length)];
}


/**
 * @swagger
 * /api/listings:
 *   get:
 *     summary: Получение списка объявлений
 *     description: Получить список объявлений о недвижимости с возможностью фильтрации и пагинации
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Номер страницы
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Количество объявлений на странице
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Минимальная цена
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Максимальная цена
 *       - in: query
 *         name: minRooms
 *         schema:
 *           type: integer
 *         description: Минимальное количество комнат
 *       - in: query
 *         name: maxRooms
 *         schema:
 *           type: integer
 *         description: Максимальное количество комнат
 *     responses:
 *       200:
 *         description: Успешный ответ со списком объявлений
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListingsResponse'
 *       400:
 *         description: Ошибка в параметрах запроса
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Описание ошибки
 */
app.get('/api/listings', (req, res) => {
    const { page = 1, limit = 20, minPrice, maxPrice, minRooms, maxRooms } = req.query;

    let filtered = [...listings];

    if (minPrice) filtered = filtered.filter(l => l.price >= minPrice);
    if (maxPrice) filtered = filtered.filter(l => l.price <= maxPrice);
    if (minRooms) filtered = filtered.filter(l => l.rooms >= minRooms);
    if (maxRooms) filtered = filtered.filter(l => l.rooms <= maxRooms);

    const start = (page - 1) * limit;
    const paginatedItems = filtered.slice(start, start + Number(limit));

    res.json({
        items: paginatedItems,
        total: filtered.length,
        page: Number(page),
        totalPages: Math.ceil(filtered.length / limit)
    });
});

/**
 * @swagger
 * /api/listings/{id}:
 *   get:
 *     summary: Получение конкретного объявления
 *     description: Получить детальную информацию об объявлении по его идентификатору
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Идентификатор объявления
 *     responses:
 *       200:
 *         description: Успешный ответ с деталями объявления
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Listing'
 *       404:
 *         description: Объявление не найдено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 'Объявление не найдено'
 */
app.get('/api/listings/:id', (req, res) => {
    const listing = listings.find(l => l.id === Number(req.params.id));
    if (!listing) return res.status(404).json({ error: 'Объявление не найдено' });
    res.json(listing);
});

app.get('/api/placeholder/:width/:height', async (req, res) => {
    const width = parseInt(req.params.width);
    const height = parseInt(req.params.height);

    // Проверка размеров
    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0 || width > 2000 || height > 2000) {
        return res.status(400).send('Invalid dimensions');
    }

    // Проверяем кэш
    const cacheKey = `placeholder-${width}-${height}`;
    const cachedImage = cache.get(cacheKey);
    if (cachedImage) {
        res.set('Content-Type', 'image/jpeg');
        return res.send(cachedImage);
    }

    try {
        // Создаем SVG с случайным фоном и текстом
        const backgroundColor = getRandomColor();
        const text = getRandomText();
        const fontSize = Math.min(width, height) * 0.1; // 10% от меньшей стороны

        const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="${backgroundColor}"/>
          <text 
            x="50%" 
            y="50%" 
            font-family="Arial" 
            font-size="${fontSize}px" 
            fill="white" 
            text-anchor="middle" 
            dominant-baseline="middle"
          >${text}</text>
          <text 
            x="50%" 
            y="70%" 
            font-family="Arial" 
            font-size="${fontSize * 0.5}px" 
            fill="white" 
            text-anchor="middle" 
            dominant-baseline="middle"
          >${width}x${height}</text>
        </svg>
      `;

        // Конвертируем SVG в JPEG
        const buffer = await sharp(Buffer.from(svg))
            .jpeg({
                quality: 80,
                progressive: true
            })
            .toBuffer();

        // Сохраняем в кэш
        cache.set(cacheKey, buffer);

        // Отправляем изображение
        res.set('Content-Type', 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=3600'); // кэширование на 1 час
        res.send(buffer);

    } catch (error) {
        console.error('Error generating placeholder:', error);
        res.status(500).send('Error generating image');
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log(`Документация Swagger доступна по адресу http://localhost:${PORT}/api-docs`);
});