const { series, src, dest } = require('gulp');
const fs = require('fs');
const manifestJson = require('./src/manifest.json');
const ts = require('gulp-typescript');

async function isExist(path) {
    return new Promise(resolve => {
        fs.access(path, err => {
            resolve(!err);
        });
    });
}

function clean() {
    console.log('clean dir', manifestJson.header.name);
    fs.rmSync(manifestJson.header.name, { recursive: true });
}

async function init() {
    const exist = await isExist(manifestJson.header.name);
    if (exist) clean();
}

function comprAndcompa() {
    return src('src/**/*.ts')
        .pipe(ts({
            module: "es2020",
            moduleResolution: "node",
            lib: ["es2020", "dom"],
            strict: true,
            target: "es2020",
            noImplicitAny: true,
        }))
        .pipe(dest(manifestJson.header.name));
}

function resolveJson() {
    return src('src/**/*.json').pipe(dest(manifestJson.header.name));
}


module.exports.default = series(init, comprAndcompa, resolveJson);
