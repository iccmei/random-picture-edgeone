// === 1. 生成 functions/api.js ===
const apiJsContent = `
export function onRequestGet(context) {
  // 由构建脚本注入的 PC 端图片列表
  const pc = ${JSON.stringify(pcImages)};
  
  // 由构建脚本注入的移动端图片列表
  const phone = ${JSON.stringify(phoneImages)};

  // 获取请求头中的 User-Agent 字符串，用于判断设备类型
  const userAgent = context.request.headers.get("user-agent") || "";

  // 使用正则判断是否为移动设备 (手机/平板)
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent);

  // 根据设备类型选择对应的图片列表
  const list = isMobile ? phone : pc;

  // 随机选择一张图片并拼接完整 URL
  // 如果列表为空，则指向默认的 notfound 图片
  const url = list.length > 0
    ? "${imageBaseUrl}/" + list[Math.floor(Math.random() * list.length)]
    : "${imageBaseUrl}/notfound.jpg";

  // 构造响应对象
  // 使用 302 Found 状态码进行临时重定向
  return new Response(null, {
    status: 302,
    headers: {
      // 重定向的目标地址
      "Location": url,
      
      // 核心修复：强制禁止浏览器和 CDN 缓存此跳转响应
      // no-store, no-cache: 不存储缓存，每次都向服务器验证
      // must-revalidate: 过期必须验证
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      
      // 允许跨域访问
      "Access-Control-Allow-Origin": "*"
    }
  });
}
`.trim();
