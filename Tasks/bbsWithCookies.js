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
  const response = await fetch(SignPageUrl, {
    "headers": {
      "accept": "text/plain, */*; q=0.01",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
      "priority": "u=1, i",
      "sec-ch-ua": "\"Chromium\";v=\"124\", \"Google Chrome\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-requested-with": "XMLHttpRequest",
      "cookie": opts.cookie,
      "Referer": SignBaseUrl,
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "body": null,
    "method": "POST"
  });
  const result = await response.json();
  return result
}
logBBS().then(res => console.log(res));