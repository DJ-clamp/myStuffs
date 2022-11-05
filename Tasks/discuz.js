/**
 * clamp Discuz论坛签到打卡
 *
 *
 */
const $ = new Env(" Discuz签到");

$.message = "";
let opts = {
  username: process.env.BBSUSERNAME || "",
  password: process.env.BBSPASSWORD || "",
  baseUrl: process.env.BBSBASEURL || "", //论坛首页地址 结尾带上”/”,
  qdxq: "kx", //签到时使用的心情
  todaysay: "开心~~~", //想说的话
};

//封装请求参数
class generateRequests {
  options = {
    username: "",
    password: "",
    baseUrl: "",
    //心情：开心，难过，郁闷，无聊，怒，擦汗，奋斗，慵懒，衰
    //{"kx","ng","ym","wl","nu","ch","fd","yl","shuai"};

    qdxq: "", //签到时使用的心情
    todaysay: "", //想说的话
  };
  cookie;
  // constructor({ username, password, baseUrl }) {
  constructor(options) {
    this.options = { ...options };
  }
  getUsername() {
    return this.options.username;
  }
  getPassword() {
    return this.options.password;
  }
  getBaseUrl() {
    return this.options.baseUrl;
  }

  getCookie() {
    return this.cookie;
  }
  getQdxq() {
    return this.options.qdxq;
  }
  getTodaysay() {
    return this.options.todaysay;
  }

  // 账号登录地址
  loginPageUrl() {
    return this.getBaseUrl() + "member.php?mod=logging&action=login";
  }
  // 账号信息提交地址
  loginSubmitUrl() {
    return (
      this.getBaseUrl() +
      "member.php?mod=logging&action=login&loginsubmit=yes&loginhash=LNvu3"
    );
  }
  //签到页面地址
  signPageUrl() {
    return this.getBaseUrl() + "plugin.php?id=dsu_paulsign:sign";
  }
  //签到信息提交地址
  signSubmitUrl() {
    return (
      this.getBaseUrl() +
      "plugin.php?id=dsu_paulsign:sign&operation=qiandao&infloat=0&inajax=0"
    );
  }

  //请求登录参数
  LoginSubmit() {
    return {
      url: this.loginSubmitUrl(),
      body: `username=${this.getUsername()}&password=${this.getPassword()}`,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Linux; Android 10; Redmi K30) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.83 Mobile Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded",
        // 'Cookie': cookie,
      },
    };
  }
  signPageWithCookie(cookie) {
    return {
      url: this.signPageUrl(),
      headers: {
        cookie: cookie,
        "user-agent":
          "Mozilla/5.0 (Linux; Android 10; Redmi K30) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.83 Mobile Safari/537.36",
      },
    };
  }

  signSubmitWithCookie(cookie, hashString, qdxq, todaysay) {
    return {
      url: this.signSubmitUrl(),
      body: `qdmode=1&formhash=${hashString}&qdxq=${qdxq}&fastreply=0&todaysay=${todaysay}`,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Linux; Android 10; Redmi K30) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.83 Mobile Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookie,
      },
    };
  }

  getFormhash(res) {
    const re = /name="formhash" value="(.*?)"/i;
    const str = re.exec(res);
    return str[1];
  }
  //登录并获取cookie
  async Login() {
    $.log("开始登陆");
    return new Promise(async (resolve, reject) => {
      return $.post(this.LoginSubmit(), async (err, response, data) => {
        try {
          if (err) {
            $.msg(err);
          } else {
            $.log("取得cookie");
            this.cookie = response.headers["set-cookie"];
          }
        } catch (e) {
          $.msg(e);
          reject(e);
        } finally {
          return resolve({ body: data, cookie: this.cookie });
        }
      });
    });
  }
  async getSignPage(cookie) {
    return new Promise(async (resolve, reject) => {
      $.get(this.signPageWithCookie(cookie), async (err, response, data) => {
        if (data.indexOf("您今天已经签到过") > -1) {
          // reject({
          //   hasSigned: true,
          //   info: ($.message += "今天已签过到\r\n"),
          // });
          reject(($.message += "今天已签过到\r\n"));
        } else {
          let hashString = this.getFormhash(data);
          resolve({ hashString: hashString });
        }
      });
    });
  }

  async postSignSubmit(ck, hashString, qdxq, todaysay) {
    return new Promise(async (resolve, reject) => {
      $.log("开始签到");
      return $.post(
        this.signSubmitWithCookie(ck, hashString, qdxq, todaysay),
        async (err, response, data) => {
          try {
            if (data.indexOf("今日已经签到") < 0) {
              $.message += "签到成功\r\n";
            } else {
              $.message += "签到失败\r\n";
            }
            let re = /class="showmenu">积分: (.*?)\</i;
            const score = re.exec(data)[1];
            $.message += "当前积分" + score + "分";
            return resolve({ message: `${$.message}` });
          } catch (e) {
            $.msg(e);
          }
        }
      );
    });
  }

  // 携带cookie请求每天签到页面
  async SignPage(cookie = null) {
    let ck = cookie ? cookie : this.getCookie();
    try {
      let { hashString } = await this.getSignPage(ck);
      let { message } = await this.postSignSubmit(
        ck,
        hashString,
        this.getQdxq(),
        this.getTodaysay()
      );
      return message || "";
    } catch (e) {
      return e;
    }
  }
}

//开始签到
(async () => {
  const Discuz = new generateRequests(opts);
  await Discuz.Login();
  let message = await Discuz.SignPage(Discuz.cookie);
  $.msg(message);
})();

// prettier-ignore
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`\ud83d\udd14${this.name}, \u5f00\u59cb!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),a={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(a,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t){let e={"M+":(new Date).getMonth()+1,"d+":(new Date).getDate(),"H+":(new Date).getHours(),"m+":(new Date).getMinutes(),"s+":(new Date).getSeconds(),"q+":Math.floor(((new Date).getMonth()+3)/3),S:(new Date).getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,((new Date).getFullYear()+"").substr(4-RegExp.$1.length)));for(let s in e)new RegExp("("+s+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?e[s]:("00"+e[s]).substr((""+e[s]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r)));let h=["","==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];h.push(e),s&&h.push(s),i&&h.push(i),console.log(h.join("\n")),this.logs=this.logs.concat(h)}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t.stack):this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}
