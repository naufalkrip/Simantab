const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('console', msg => { if(msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text()); });
  await page.goto('http://localhost:5173/admin');
  await page.evaluate(() => {
    localStorage.setItem('adminLoggedIn', 'true');
    localStorage.setItem('mbChondroMembers', JSON.stringify([{id: '1', name: 'Test User', phone: '123'}]));
  });
  await page.reload();
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    const addBtn = btns.find(b => b.textContent.includes('Tambah Tabungan'));
    if (addBtn) addBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => {
    const cb = document.querySelector('[role="combobox"]');
    if (cb) cb.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
