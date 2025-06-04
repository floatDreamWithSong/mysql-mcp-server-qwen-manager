import { build } from 'esbuild';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 创建dist目录
const distDir = join(__dirname, 'dist');
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

console.log('🚀 开始构建MySQL MCP...');

// 读取package.json获取依赖列表
const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'));
const allDependencies = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies
};
const externalDeps = Object.keys(allDependencies);

console.log('📦 外部依赖:', externalDeps);

try {
  await build({
    entryPoints: [join(__dirname, 'src/index.js')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    outfile: join(distDir, 'mysql-mcp.js'),
    external: externalDeps, // 标记所有依赖为外部
    banner: {
      js: '#!/usr/bin/env node',
    },
    minify: false,
    sourcemap: true,
  });
  
  console.log('✅ Bundle构建完成: dist/mysql-mcp.js');
} catch (error) {
  console.error('❌ Bundle构建失败:', error.message);
}