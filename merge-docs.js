#!/usr/bin/env node
/**
 * 文档合并工具
 * 用法: node merge-docs.js <文件夹路径> [输出文件名]
 * 
 * 示例:
 *   node merge-docs.js ./public/ai-apps
 *   node merge-docs.js ./src merged-output.txt
 */

const fs = require('fs');
const path = require('path');

// 支持的文档扩展名
const SUPPORTED_EXTENSIONS = [
  '.txt', '.md', '.html', '.htm', '.css', '.js', '.ts', '.tsx', '.jsx',
  '.json', '.xml', '.yaml', '.yml', '.sql', '.py', '.java', '.c', '.cpp',
  '.h', '.cs', '.go', '.rs', '.rb', '.php', '.sh', '.bat', '.ps1',
  '.vue', '.svelte', '.astro', '.mdx', '.csv', '.log', '.ini', '.conf',
  '.env', '.gitignore', '.dockerfile', '.makefile'
];

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 递归获取所有文件
function getAllFiles(dirPath, fileList = []) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // 跳过 node_modules 和 .git 目录
      if (item !== 'node_modules' && item !== '.git' && !item.startsWith('.')) {
        getAllFiles(fullPath, fileList);
      }
    } else {
      const ext = path.extname(item).toLowerCase();
      if (SUPPORTED_EXTENSIONS.includes(ext) || ext === '') {
        fileList.push(fullPath);
      }
    }
  }
  
  return fileList;
}

// 生成分隔线
function generateSeparator(filePath, index) {
  const line = '='.repeat(80);
  return `
${line}
📄 文件 ${index + 1}: ${filePath}
${line}

`;
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    log('cyan', '\n📚 文档合并工具');
    log('yellow', '━'.repeat(50));
    console.log('\n用法: node merge-docs.js <文件夹路径> [输出文件名]\n');
    console.log('示例:');
    console.log('  node merge-docs.js ./public/ai-apps');
    console.log('  node merge-docs.js ./src merged-output.txt');
    console.log('  node merge-docs.js C:\\Users\\Documents\\MyProject\n');
    log('yellow', '支持的文件类型:');
    console.log(SUPPORTED_EXTENSIONS.join(', '));
    process.exit(0);
  }
  
  const inputDir = args[0];
  const outputFile = args[1] || `merged-docs-${Date.now()}.txt`;
  
  // 检查输入目录是否存在
  if (!fs.existsSync(inputDir)) {
    log('red', `❌ 错误: 目录不存在 - ${inputDir}`);
    process.exit(1);
  }
  
  if (!fs.statSync(inputDir).isDirectory()) {
    log('red', `❌ 错误: 路径不是目录 - ${inputDir}`);
    process.exit(1);
  }
  
  log('cyan', '\n📚 文档合并工具');
  log('yellow', '━'.repeat(50));
  log('blue', `\n📁 扫描目录: ${path.resolve(inputDir)}`);
  
  // 获取所有文件
  const files = getAllFiles(inputDir);
  
  if (files.length === 0) {
    log('yellow', '⚠️  未找到任何支持的文档文件');
    process.exit(0);
  }
  
  log('green', `✅ 找到 ${files.length} 个文件\n`);
  
  // 合并文件内容
  let mergedContent = '';
  const toc = []; // 目录
  
  // 添加头部信息
  mergedContent += `${'#'.repeat(80)}
#
#  合并文档
#  生成时间: ${new Date().toLocaleString('zh-CN')}
#  源目录: ${path.resolve(inputDir)}
#  文件数量: ${files.length}
#
${'#'.repeat(80)}

`;

  // 生成目录
  mergedContent += '📑 目录\n';
  mergedContent += '─'.repeat(40) + '\n';
  files.forEach((file, index) => {
    const relativePath = path.relative(inputDir, file);
    mergedContent += `${index + 1}. ${relativePath}\n`;
    toc.push(relativePath);
  });
  mergedContent += '\n';
  
  // 合并每个文件
  let successCount = 0;
  let errorCount = 0;
  
  files.forEach((file, index) => {
    const relativePath = path.relative(inputDir, file);
    
    try {
      const content = fs.readFileSync(file, 'utf-8');
      mergedContent += generateSeparator(relativePath, index);
      mergedContent += content;
      
      // 确保文件内容后有换行
      if (!content.endsWith('\n')) {
        mergedContent += '\n';
      }
      
      successCount++;
      console.log(`  ${colors.green}✓${colors.reset} ${relativePath}`);
    } catch (err) {
      errorCount++;
      mergedContent += generateSeparator(relativePath, index);
      mergedContent += `[读取错误: ${err.message}]\n`;
      console.log(`  ${colors.red}✗${colors.reset} ${relativePath} - ${err.message}`);
    }
  });
  
  // 添加尾部信息
  mergedContent += `
${'#'.repeat(80)}
#  合并完成
#  成功: ${successCount} 个文件
#  失败: ${errorCount} 个文件
${'#'.repeat(80)}
`;
  
  // 写入输出文件
  try {
    fs.writeFileSync(outputFile, mergedContent, 'utf-8');
    log('yellow', '\n━'.repeat(50));
    log('green', `\n✅ 合并完成!`);
    log('blue', `📄 输出文件: ${path.resolve(outputFile)}`);
    log('cyan', `📊 文件大小: ${(Buffer.byteLength(mergedContent, 'utf-8') / 1024).toFixed(2)} KB`);
    console.log('');
  } catch (err) {
    log('red', `\n❌ 写入输出文件失败: ${err.message}`);
    process.exit(1);
  }
}

main();

