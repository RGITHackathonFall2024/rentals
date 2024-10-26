// generate-listings.js
import { faker } from '@faker-js/faker/locale/ru';
import fs from 'fs/promises';
import fetch from 'node-fetch';

const LISTINGS_COUNT = 100;
const ROSTOV_BOUNDS = {
    north: 47.2953,
    south: 47.1673,
    east: 39.8323,
    west: 39.6143
};

const imageTypes = [
    { width: 800, height: 600 },  // Стандартное фото
    { width: 1200, height: 800 }, // Большое фото
    { width: 400, height: 300 },  // Маленькое фото
    { width: 1000, height: 750 }  // Среднее фото
];
// Список популярных районов Ростова для более реалистичного распределения
const ROSTOV_AREAS = [
    'Центральный район',
    'Ленинский район',
    'Кировский район',
    'Октябрьский район',
    'Первомайский район',
    'Пролетарский район',
    'Советский район',
    'Ворошиловский район',
    'Железнодорожный район'
];

// Список популярных улиц для каждого района
const STREETS_BY_AREA = {
    'Центральный район': [
        'Большая Садовая улица',
        'Пушкинская улица',
        'проспект Ворошиловский',
        'улица Красноармейская',
        'улица Социалистическая'
    ],
    'Ленинский район': [
        'улица Согласия',
        'улица Береговая',
        'улица Донская',
        'улица Города Волос',
        'переулок Газетный'
    ],
    // ... добавьте улицы для других районов
};

async function getAddressDetails(street, houseNumber) {
    const query = encodeURIComponent(`${houseNumber} ${street}, Ростов-на-Дону, Россия`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

    try {
        // Добавляем User-Agent как требует Nominatim
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'RentalListingsGenerator/1.0'
            }
        });
        const data = await response.json();

        if (data && data[0]) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon),
                displayName: data[0].display_name
            };
        }
        return null;
    } catch (error) {
        console.error(`Ошибка при получении геоданных для адреса: ${street}`, error);
        return null;
    }
}

// Функция задержки для соблюдения ограничений API
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Генерация случайного адреса
function generateAddress() {
    const area = faker.helpers.arrayElement(ROSTOV_AREAS);
    const street = faker.helpers.arrayElement(STREETS_BY_AREA[area] || [`улица ${faker.location.street()}`]);
    const houseNumber = faker.number.int({ min: 1, max: 150 });
    return {
        area,
        street,
        houseNumber: houseNumber.toString(),
        fullAddress: `${street}, ${houseNumber}, ${area}, Ростов-на-Дону`
    };
}

// Генерация характеристик квартиры на основе района
function generateApartmentDetails(area) {
    // Разные районы имеют разные диапазоны цен и характеристик
    const isPremium = ['Центральный район', 'Ленинский район', 'Кировский район'].includes(area);

    const rooms = faker.number.int({ min: isPremium ? 1 : 1, max: isPremium ? 5 : 3 });
    const basePrice = isPremium ? 35000 : 20000;
    const priceRange = isPremium ? 70000 : 40000;

    return {
        rooms,
        area: faker.number.int({ min: rooms * 15 + 10, max: rooms * 25 + 20 }),
        price: faker.number.int({ min: basePrice, max: basePrice + priceRange }),
        floor: faker.number.int({ min: 1, max: isPremium ? 25 : 16 }),
        totalFloors: faker.number.int({ min: 5, max: isPremium ? 25 : 16 }),
    };
}

async function generateListings() {
    const listings = [];
    let validListings = 0;

    console.log('Начинаем генерацию объявлений...');

    while (validListings < LISTINGS_COUNT) {
        // Генерируем базовый адрес
        const addressInfo = generateAddress();

        // Получаем геоданные через API
        const addressDetails = await getAddressDetails(addressInfo.street, addressInfo.houseNumber);

        // Делаем паузу между запросами к API
        //await delay(100); // 1 секунда между запросами

        if (addressDetails &&
            addressDetails.lat >= ROSTOV_BOUNDS.south &&
            addressDetails.lat <= ROSTOV_BOUNDS.north &&
            addressDetails.lon >= ROSTOV_BOUNDS.west &&
            addressDetails.lon <= ROSTOV_BOUNDS.east) {

            const apartmentDetails = generateApartmentDetails(addressInfo.area);

            listings.push({
                id: validListings + 1,
                title: `${apartmentDetails.rooms}-комнатная квартира, ${apartmentDetails.area} м²`,
                description: generateDescription(addressInfo, apartmentDetails),
                address: addressInfo.fullAddress,
                area: addressInfo.area,
                rooms: apartmentDetails.rooms,
                price: apartmentDetails.price,
                location: {
                    lat: addressDetails.lat,
                    lng: addressDetails.lon
                },
                details: {
                    floor: apartmentDetails.floor,
                    totalFloors: apartmentDetails.totalFloors,
                    area: apartmentDetails.area,
                    hasBalcony: faker.datatype.boolean(),
                    hasParking: faker.datatype.boolean(),
                    renovationType: faker.helpers.arrayElement(['Косметический', 'Евроремонт', 'Дизайнерский', 'Требует ремонта']),
                },
                photos: Array.from({ length: faker.number.int({ min: 3, max: 6 }) }, () => {
                    const imageType = faker.helpers.arrayElement(imageTypes);
                    return `/api/placeholder/${imageType.width}/${imageType.height}`;
                }),
                contact: {
                    name: faker.person.fullName(),
                    phone: faker.phone.number('+7 ### ### ## ##'),
                    email: faker.internet.email()
                },
                created: faker.date.recent({ days: 30 }),
                views: faker.number.int({ min: 0, max: 1000 }),
                isFavorite: false
            });

            validListings++;
            console.log(`Сгенерировано объявлений: ${validListings}/${LISTINGS_COUNT}`);
        }
    }

    await fs.writeFile('./data/listings.json', JSON.stringify(listings, null, 2));
    console.log(`Генерация завершена. Создано ${listings.length} объявлений`);
}

function generateDescription(addressInfo, apartmentDetails) {
    const advantages = [
        'развитая инфраструктура',
        'рядом школа и детский сад',
        'хорошая транспортная доступность',
        'тихий двор',
        'парковка во дворе',
        'рядом парк',
        'магазины в шаговой доступности',
        'новый дом',
        'чистый подъезд',
        'консьерж'
    ];

    const selectedAdvantages = faker.helpers.arrayElements(advantages, faker.number.int({ min: 2, max: 4 }));

    return `Сдается ${apartmentDetails.rooms}-комнатная квартира в ${addressInfo.area}. 
${faker.lorem.paragraph()}

Характеристики:
• Площадь: ${apartmentDetails.area} м²
• Этаж: ${apartmentDetails.floor} из ${apartmentDetails.totalFloors}
• Комнаты: ${apartmentDetails.rooms}

Преимущества:
${selectedAdvantages.map(adv => '• ' + adv).join('\n')}

${faker.lorem.paragraph()}

Звоните, отвечу на все вопросы!`;
}

// Запускаем генерацию
generateListings().catch(console.error);