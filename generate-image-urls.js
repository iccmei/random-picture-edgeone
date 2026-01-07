const fs = require("fs");
const path = require("path");

const imageBaseUrl = "./images";
const apiFilePath = path.join("functions", "api.js");
const indexHtmlPath = path.join("images", "index.html");
const rootDir = path.join(process.cwd(), "images");

const isImage = (filename) => /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);

// 收集 PC 和 Phone 图片路径
const walkDir = (dir) => {
  const results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results.push(...walkDir(filePath));
    } else if (isImage(file)) {
      results.push(path.relative(rootDir, filePath).replace(/\\/g, "/"));
    }
  });
  return results;
};

const pcImages = walkDir(path.join(rootDir, "pc"));
const phoneImages = walkDir(path.join(rootDir, "phone"));

// === 1. 生成 functions/api.js ===
// 修改：构造 Response 添加 Cache-Control 头，解决重定向缓存问题
const apiJsContent = `
export function onRequestGet(context) {
  const pc = ${JSON.stringify(pcImages)};
  const phone = ${JSON.stringify(phoneImages)};
  const userAgent = context.request.headers.get("user-agent") || "";
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent);
  const list = isMobile ? phone : pc;
  const url = list.length > 0
    ? "${imageBaseUrl}/" + list[Math.floor(Math.random() * list.length)]
    : "${imageBaseUrl}/notfound.jpg";
    
  return new Response(null, {
    status: 302,
    headers: {
      "Location": url,
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
`.trim();

fs.mkdirSync(path.dirname(apiFilePath), { recursive: true });
fs.writeFileSync(apiFilePath, apiJsContent);
console.log("✅ 生成 functions/api.js 成功");

// === 2. 生成 images/index.html ===
let html = `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>CDN 文件索引</title>
  <style>
    body { font-family: sans-serif; padding: 2rem; background: #f9f9f9; }
    ul { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem; list-style: none; padding: 0; }
    li { background: white; padding: 1rem; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.05); overflow: hidden; word-break: break-all; display: flex; flex-direction: column; align-items: center; }
    .preview img {
      width: 100%;
      max-height: 140px;
      object-fit: cover;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      cursor: zoom-in;
      transition: transform 0.2s;
    }
    .preview img:hover {
      transform: scale(1.03);
    }
    .preview div {
      margin-top: 0.5rem;
      font-size: 0.85rem;
      color: #333;
      text-align: center;
    }

    /* Modal 样式 */
    .modal {
      display: none;
      position: fixed;
      z-index: 1000;
      left: 0; top: 0;
      width: 100vw; height: 100vh;
      background-color: rgba(0, 0, 0, 0.8);
      justify-content: center;
      align-items: center;
    }
    .modal img {
      max-width: 90vw;
      max-height: 90vh;
      border-radius: 10px;
      box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
    }
    .modal:target {
      display: flex;
    }
  </style>
</head>
<body>
  <h1>🖼️ 图片索引</h1>
  <ul>
`;

[...pcImages, ...phoneImages].forEach((imgPath, index) => {
  const fullUrl = `${imageBaseUrl}/${imgPath}`;
  const modalId = `modal-${index}`;
  html += `
    <li>
      <a class="preview" href="#${modalId}">
        <img src="${fullUrl}" alt="${imgPath}" loading="lazy" />
        <div>${imgPath}</div>
      </a>
    </li>
    <div class="modal" id="${modalId}" onclick="location.hash='';">
      <img src="${fullUrl}" alt="${imgPath}" />
    </div>
  `;
});

html += `
  </ul>
</body>
</html>
`;

fs.mkdirSync(path.dirname(indexHtmlPath), { recursive: true });
fs.writeFileSync(indexHtmlPath, html);
console.log("✅ 生成 images/index.html 成功");
