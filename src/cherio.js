import cheerio from 'cheerio';

const htmlTest = `
<html lang="ru">
  <head>
    <meta charset="utf-8">
    <title>Курсы по программированию Хекслет</title>
  </head>
  <body>
    <img src="/assets/professions/nodejs.png" alt="Иконка профессии Node.js-программист" />
    <img src="easy.jpg" alt="Иконка профессии Node.js-программист" />
    <h3>
      <a href="/professions/nodejs">Node.js-программист</a>
    </h3>
  </body>
</html>`;

const editHtml = (html) => {
  const $ = cheerio.load(html);

  $('img[src]').each((_, el) => {
    $(el).attr('src', 'newp.png');
    return el;
  });

  console.log($.html());
  return $.html();
};

editHtml(htmlTest);
