/**
 * Простой скрипт для тестирования API пагинации
 * Запуск: node test-pagination-api.js
 */

const API_URL = process.env.API_URL || 'http://localhost:3001';
const TOKEN = process.env.TOKEN || ''; // Опционально, если нужна авторизация

async function testPagination() {
  console.log('🧪 Тестирование пагинации API\n');
  console.log(`API URL: ${API_URL}\n`);

  // Тест 1: Recent rides с пагинацией
  console.log('📄 Тест 1: Recent rides (page 1, pageSize 5)');
  try {
    const url1 = `${API_URL}/api/rides?status=active&page=1&pageSize=5&includePagination=true&sortBy=recent`;
    const response1 = await fetch(url1, {
      headers: TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {}
    });
    const data1 = await response1.json();
    
    if (data1.data && Array.isArray(data1.data)) {
      console.log(`✅ Успешно! Получено ${data1.data.length} поездок`);
      console.log(`   Total: ${data1.total}, Pages: ${data1.totalPages}, Current: ${data1.page}`);
      console.log(`   Has more: ${data1.hasMore}\n`);
    } else {
      console.log(`❌ Ошибка: Неверный формат ответа`);
      console.log(`   Ответ:`, JSON.stringify(data1, null, 2));
    }
  } catch (error) {
    console.log(`❌ Ошибка:`, error.message);
  }

  // Тест 2: Поиск с фильтрами
  console.log('📄 Тест 2: Поиск с фильтрами (page 1, pageSize 10)');
  try {
    const url2 = `${API_URL}/api/rides?status=active&from=Москва&page=1&pageSize=10&includePagination=true`;
    const response2 = await fetch(url2, {
      headers: TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {}
    });
    const data2 = await response2.json();
    
    if (data2.data && Array.isArray(data2.data)) {
      console.log(`✅ Успешно! Получено ${data2.data.length} поездок`);
      console.log(`   Total: ${data2.total}, Pages: ${data2.totalPages}\n`);
    } else {
      console.log(`❌ Ошибка: Неверный формат ответа`);
      console.log(`   Ответ:`, JSON.stringify(data2, null, 2));
    }
  } catch (error) {
    console.log(`❌ Ошибка:`, error.message);
  }

  // Тест 3: Обратная совместимость (без пагинации)
  console.log('📄 Тест 3: Обратная совместимость (limit/offset)');
  try {
    const url3 = `${API_URL}/api/rides?status=active&limit=10&offset=0`;
    const response3 = await fetch(url3, {
      headers: TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {}
    });
    const data3 = await response3.json();
    
    if (Array.isArray(data3)) {
      console.log(`✅ Успешно! Получено ${data3.length} поездок (массив)\n`);
    } else {
      console.log(`❌ Ошибка: Ожидался массив, получен объект`);
      console.log(`   Ответ:`, JSON.stringify(data3, null, 2));
    }
  } catch (error) {
    console.log(`❌ Ошибка:`, error.message);
  }

  // Тест 4: Вторая страница
  console.log('📄 Тест 4: Вторая страница (page 2)');
  try {
    const url4 = `${API_URL}/api/rides?status=active&page=2&pageSize=5&includePagination=true`;
    const response4 = await fetch(url4, {
      headers: TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {}
    });
    const data4 = await response4.json();
    
    if (data4.data && Array.isArray(data4.data)) {
      console.log(`✅ Успешно! Страница ${data4.page}`);
      console.log(`   Получено ${data4.data.length} поездок`);
      console.log(`   Has more: ${data4.hasMore}\n`);
    } else {
      console.log(`❌ Ошибка: Неверный формат ответа\n`);
    }
  } catch (error) {
    console.log(`❌ Ошибка:`, error.message);
  }

  console.log('✨ Тестирование завершено!');
}

// Запуск
testPagination().catch(console.error);

