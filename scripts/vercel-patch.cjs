/** Patch os.hostname/userInfo before Vercel CLI loads (Windows Korean name bug). */
const os = require("node:os");

os.hostname = () => "vercel-cli-host";

const originalUserInfo = os.userInfo.bind(os);
os.userInfo = () => {
  const info = originalUserInfo();
  return { ...info, username: "vercel-user" };
};
