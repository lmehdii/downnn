const chromium = require('@sparticuz/chromium-min');
const puppeteer = require('puppeteer-core');

function extractScribdInfo(url) {
  const regex = /scribd\.com\/(?:document|doc)\/(\d+)\/([^?]+)/;
  const match = url.match(regex);
  if (match) {
    const docId = match[1];
    const title = match[2].replace(/-/g, ' ');
    return { docId, title };
  } else {
    throw new Error('Invalid Scribd URL format.');
  }
}

function generateIlideLink(docId, title) {
  const fileUrl = encodeURIComponent(
    `https://scribd.vdownloaders.com/pdownload/${docId}%2F${title.replace(/ /g, '-')}`
  );
  const encodedTitle = encodeURIComponent(`<div><p>${title}</p></div>`);
  return `https://ilide.info/docgeneratev2?fileurl=${fileUrl}&title=${encodedTitle}&utm_source=scrfree&utm_medium=queue&utm_campaign=dl`;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const scribdUrl = req.body.scribdUrl;
  if (!scribdUrl) {
    return res.status(400).json({ error: 'Scribd URL is required' });
  }

  let browser;
  try {
    const { docId, title } = extractScribdInfo(scribdUrl);
    const ilideLink = generateIlideLink(docId, title);

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(ilideLink, { waitUntil: 'networkidle2' });

    // Implement your page interaction logic here

    res.status(200).json({ message: 'Processing complete' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
