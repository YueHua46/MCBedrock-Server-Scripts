import { series, src, dest, watch } from 'gulp'
import * as fs from 'fs'
import manifestJson from './src/manifest.json'
import typescript from 'gulp-typescript'
import uglify from 'gulp-uglify'
import babel from 'gulp-babel'
import trim from 'gulp-trim';

async function isExist(path: string) {
    return new Promise<boolean>((resolve) => {
        fs.access(path, (err) => {
            resolve(!err); // 反转条件，使得存在时返回 true
        });
    });
}

function clean() {
    console.log('clean dir', manifestJson.header.name)
    fs.rmSync(manifestJson.header.name, { recursive: true })
}

async function init() {
    const exist = await isExist(manifestJson.header.name)
    if (exist) clean()
}

function comprAndcompa() {
    return src('src/**/*.ts')
        .pipe(typescript())
        .pipe(uglify())
        .pipe(babel())
        .pipe(trim())
        .pipe(dest(manifestJson.header.name))
}

function resolveJson() {
    return src('src/**/*.json')
        .pipe(dest(manifestJson.header.name))
}

function watchFiles() {
    console.log('watching...')
    watch('src/**/*.ts', comprAndcompa)
    watch('src/**/*.json', resolveJson)
}

export default series(init, comprAndcompa, resolveJson, watchFiles)
