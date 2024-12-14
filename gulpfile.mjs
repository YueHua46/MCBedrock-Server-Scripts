import { series, src, dest, watch } from 'gulp'
import fs from 'fs'
import bpManifestJson from './src/BP/manifest.json' with { type: 'json' }
import rpManifestJson from './src/RP/manifest.json' with { type: 'json' }
import ts from 'gulp-typescript'
import prettier from 'gulp-prettier'
import archiver from 'archiver'
import dotenv from 'dotenv'
import os from 'os'

dotenv.config()

const env = process.env.ENV || 'windows' // linux or windows

let devBpPath, devRpPath
if (env === 'windows') {
  devBpPath =
    os.homedir() +
    '\\AppData\\Local\\Packages\\Microsoft.MinecraftUWP_8wekyb3d8bbwe\\LocalState\\games\\com.mojang\\development_behavior_packs'
  devRpPath =
    os.homedir() +
    '\\AppData\\Local\\Packages\\Microsoft.MinecraftUWP_8wekyb3d8bbwe\\LocalState\\games\\com.mojang\\development_resource_packs'
} else if (env === 'linux') {
  // linux 测试服务器路径
  devBpPath = '/root/MC_SERVER_LIST/MC_TEST_SERVER/development_behavior_packs'
  devRpPath = '/root/MC_SERVER_LIST/MC_TEST_SERVER/development_resource_packs'
} else {
  throw new Error('Unsupported OS')
}

console.log('bp path --> ', devBpPath)
console.log('rp path --> ', devRpPath)

async function isExist(path) {
  return new Promise(resolve => {
    fs.access(path, err => {
      resolve(!err)
    })
  })
}

function clean() {
  console.log('Cleaning directory:', bpManifestJson.header.name)
  if (fs.existsSync(bpManifestJson.header.name)) {
    fs.rmSync(bpManifestJson.header.name, { recursive: true })
  }
  console.log('Cleaning directory:', rpManifestJson.header.name)
  if (fs.existsSync(rpManifestJson.header.name)) {
    fs.rmSync(rpManifestJson.header.name, { recursive: true })
  }
}

async function init() {
  const existBP = await isExist(bpManifestJson.header.name)
  const existRP = await isExist(rpManifestJson.header.name)
  if (existBP || existRP) clean()
}

function comprAndcompa() {
  return src('src/BP/**/*.ts')
    .pipe(
      ts({
        module: 'es2020',
        moduleResolution: 'node',
        lib: ['es2020', 'dom'],
        strict: true,
        target: 'es2020',
        noImplicitAny: true,
      }),
    )
    .pipe(dest(`dist/${bpManifestJson.header.name}/`))
}

function formatJS() {
  return src(`dist/${bpManifestJson.header.name}/**/*.js`)
    .pipe(prettier({ singleQuote: true }))
    .pipe(dest(`dist/${bpManifestJson.header.name}/`))
}

function resolveBP() {
  return src(['src/BP/**/*.js', 'src/BP/**/*.json']).pipe(dest(`dist/${bpManifestJson.header.name}`))
}

function resolveRP() {
  return src('src/RP/**/*', { encoding: false }).pipe(dest(`dist/${rpManifestJson.header.name}`))
}

function packBP(suffix = '.zip') {
  return function () {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream('dist/' + bpManifestJson.header.name + suffix)
      const archive = archiver('zip', {
        zlib: { level: 9 },
      })

      output.on('close', () => {
        console.log(archive.pointer() + ' total bytes')
        console.log('归档程序已完成，输出文件描述符已关闭.')
        resolve()
      })

      archive.on('warning', err => {
        if (err.code === 'ENOENT') {
          console.warn(err)
        } else {
          reject(err)
        }
      })

      archive.on('error', err => {
        reject(err)
      })

      archive.pipe(output)
      archive.directory(bpManifestJson.header.name, false)
      archive.finalize()
    })
  }
}

function packRP(suffix = '.zip') {
  return function () {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream('dist/' + rpManifestJson.header.name + suffix)
      const archive = archiver('zip', {
        zlib: { level: 9 },
      })

      output.on('close', () => {
        console.log(archive.pointer() + ' total bytes')
        console.log('归档程序已完成，输出文件描述符已关闭.')
        resolve()
      })

      archive.on('warning', err => {
        if (err.code === 'ENOENT') {
          console.warn(err)
        } else {
          reject(err)
        }
      })

      archive.on('error', err => {
        reject(err)
      })

      archive.pipe(output)
      archive.directory(rpManifestJson.header.name, false)
      archive.finalize()
    })
  }
}

// Watch mode
function watchChange() {
  return watch('src/**/*.{ts,json,lang}', series(init, comprAndcompa, resolveRP, resolveBP, formatJS, copyBP, copyRP))
}

async function cleanDevBP() {
  if (await isExist(devBpPath + `\\${bpManifestJson.header.name}`))
    fs.rmSync(devBpPath + `\\${bpManifestJson.header.name}`, { recursive: true })
}

async function cleanDevRP() {
  if (await isExist(devRpPath + `\\${rpManifestJson.header.name}`))
    fs.rmSync(devRpPath + `\\${rpManifestJson.header.name}`, { recursive: true })
}

async function copyBP() {
  await cleanDevBP()
  return src(`dist/${bpManifestJson.header.name}/**/*`).pipe(
    dest(devBpPath + `${env === 'windows' ? '\\' : '/'}${bpManifestJson.header.name}`),
  )
}

async function copyRP() {
  await cleanDevRP()
  return src(`dist/${rpManifestJson.header.name}/**/*`, { encoding: false }).pipe(
    dest(devRpPath + `${env === 'windows' ? '\\' : '/'}${rpManifestJson.header.name}`),
  )
}

export default series(init, comprAndcompa, resolveRP, resolveBP, formatJS)
export const pack = series(init, comprAndcompa, resolveRP, resolveBP, formatJS, packBP('.mcpack'), packRP('.mcpack'))
export const zip = series(init, comprAndcompa, resolveRP, resolveBP, formatJS, packBP(), packRP())
export const watchTask = watchChange
