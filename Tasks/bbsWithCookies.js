let opts = {
  cookie: process.env.BBSCOOKIE || "",
  baseUrl: process.env.BBSCOOKIEURL || "", //论坛首页地址 结尾带上”/”,
}
/**
 * 获取基础URL
 *
 * @returns 返回基础URL
 */
function getBaseUrl(options) {
  return options.baseUrl;
}
/**
 * 生成签名页面的URL
 *
 * @returns 返回签名页面的URL
 */
function signPageUrl(options) {
  return getBaseUrl(options) + "my-sign.htm";
}
async function logBBS() {
  const SignBaseUrl = getBaseUrl(opts);
  const SignPageUrl = signPageUrl(opts);
  try {
    const enteryURL = await fetch(SignPageUrl, {
      headers: {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Cookie": opts.cookie,
        "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
      },
      "method": "GET"
    });
    const response = await fetch(SignPageUrl, {
      headers: {
        "accept": "text/plain, */*; q=0.01",
        "Accept-Encoding":"gzip, deflate, br, zstd",
        "sec-ch-ua": "\"Chromium\";v=\"124\", \"Google Chrome\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
        "x-requested-with": "XMLHttpRequest",
        "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Cookie": opts.cookie,
        "Referer": SignBaseUrl,
      },
      method: "POST"
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("An error occurred while logging into the BBS:", error);
    throw error; // 可以选择抛出错误，以便调用者能够处理
  }
}
logBBS().then(res => console.log(res)).catch(err => console.error(err));