const { series, src, dest, watch } = require("gulp");
const fs = require("fs");
const bpManifestJson = require("./src/BP/manifest.json");
const rpManifestJson = require("./src/RP/manifest.json");
const ts = require("gulp-typescript");
const uglify = require("gulp-uglify");
const archiver = require("archiver");
const gulpIf = require("gulp-if");
const os = require("os");

const devBpPath =
  os.homedir() +
  "\\AppData\\Local\\Packages\\Microsoft.MinecraftUWP_8wekyb3d8bbwe\\LocalState\\games\\com.mojang\\development_behavior_packs";
const devRpPath =
  os.homedir() +
  "\\AppData\\Local\\Packages\\Microsoft.MinecraftUWP_8wekyb3d8bbwe\\LocalState\\games\\com.mojang\\development_resource_packs";

async function isExist(path) {
  return new Promise(resolve => {
    fs.access(path, err => {
      resolve(!err);
    });
  });
}

function clean() {
  console.log("Cleaning directory:", bpManifestJson.header.name);
  fs.rmSync(bpManifestJson.header.name, { recursive: true });
  console.log("Cleaning directory:", rpManifestJson.header.name);
  fs.rmSync(rpManifestJson.header.name, { recursive: true });
}

async function init() {
  const existBP = await isExist(bpManifestJson.header.name);
  const existRP = await isExist(rpManifestJson.header.name);
  if (existBP || existRP) clean();
}

function comprAndcompa() {
  return (
    src("src/BP/**/*.ts")
      .pipe(
        ts({
          module: "es2020",
          moduleResolution: "node",
          lib: ["es2020", "dom"],
          strict: true,
          target: "es2020",
          noImplicitAny: true,
        })
      )
      // 排除config.js
      //
      .pipe(gulpIf(file => file.path.indexOf("config.js") === -1, uglify()))
      .pipe(dest(`dist/${bpManifestJson.header.name}/`))
  );
}

function resolveBP() {
  return src("src/BP/**/*.{json,png}").pipe(dest(`dist/${bpManifestJson.header.name}`));
}

function resolveRP() {
  return src("src/RP/**/*").pipe(dest(`dist/${rpManifestJson.header.name}`));
}

function packBP(suffix = ".zip") {
  return function () {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream("dist/" + bpManifestJson.header.name + suffix);
      const archive = archiver("zip", {
        zlib: { level: 9 }, // 设置压缩级别为最高
      });

      output.on("close", () => {
        console.log(archive.pointer() + " total bytes");
        console.log("归档程序已完成，输出文件描述符已关闭.");
        resolve();
      });

      archive.on("warning", err => {
        if (err.code === "ENOENT") {
          console.warn(err);
        } else {
          reject(err);
        }
      });

      archive.on("error", err => {
        reject(err);
      });

      archive.pipe(output);
      archive.directory(bpManifestJson.header.name, false);
      archive.finalize();
    });
  };
}

function packRP(suffix = ".zip") {
  return function () {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream("dist/" + rpManifestJson.header.name + suffix);
      const archive = archiver("zip", {
        zlib: { level: 9 }, // 设置压缩级别为最高
      });

      output.on("close", () => {
        console.log(archive.pointer() + " total bytes");
        console.log("归档程序已完成，输出文件描述符已关闭.");
        resolve();
      });

      archive.on("warning", err => {
        if (err.code === "ENOENT") {
          console.warn(err);
        } else {
          reject(err);
        }
      });

      archive.on("error", err => {
        reject(err);
      });

      archive.pipe(output);
      archive.directory(rpManifestJson.header.name, false);
      archive.finalize();
    });
  };
}

// Watch mode
function watchChange() {
  return watch("src/**/*.{ts,json,lang}", series(init, comprAndcompa, resolveRP, resolveBP, copyBP, copyRP));
}
function cleanDevBP() {
  if (isExist(devBpPath + `/${bpManifestJson.header.name}`))
    fs.rmSync(devBpPath + `/${bpManifestJson.header.name}`, { recursive: true });
}
function cleanDevRP() {
  if (isExist(devRpPath + `/${rpManifestJson.header.name}`))
    fs.rmSync(devRpPath + `/${rpManifestJson.header.name}`, { recursive: true });
}
function copyBP() {
  cleanDevBP();
  return src(`dist/${bpManifestJson.header.name}/**/*`).pipe(dest(devBpPath + `/${bpManifestJson.header.name}`));
}
function copyRP() {
  cleanDevRP();
  return src(`dist/${rpManifestJson.header.name}/**/*`).pipe(dest(devRpPath + `/${rpManifestJson.header.name}`));
}

module.exports.default = series(init, comprAndcompa, resolveRP, resolveBP);
module.exports.pack = series(init, comprAndcompa, resolveRP, resolveBP, packBP(".mcpack"), packRP(".mcpack"));
module.exports.zip = series(init, comprAndcompa, resolveRP, resolveBP, packBP(), packRP());
module.exports.watch = watchChange;
