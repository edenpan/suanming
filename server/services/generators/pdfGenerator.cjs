/**
 * PDF格式生成器
 * 将分析结果转换为PDF文档
 * 使用html-pdf库进行转换
 */

const generatePDF = async (analysisData, analysisType, userName) => {
  try {
    // 生成HTML内容
    const htmlContent = generateHTML(analysisData, analysisType, userName);
    
    // 由于html-pdf库需要额外安装，这里先返回HTML转PDF的占位符
    // 在实际部署时需要安装 html-pdf 或 puppeteer
    
    // 临时解决方案：返回HTML内容作为PDF（实际应该转换为PDF）
    const Buffer = require('buffer').Buffer;
    return Buffer.from(htmlContent, 'utf8');
    
    // 正式实现应该是：
    // const pdf = require('html-pdf');
    // return new Promise((resolve, reject) => {
    //   pdf.create(htmlContent, {
    //     format: 'A4',
    //     border: {
    //       top: '0.5in',
    //       right: '0.5in',
    //       bottom: '0.5in',
    //       left: '0.5in'
    //     }
    //   }).toBuffer((err, buffer) => {
    //     if (err) reject(err);
    //     else resolve(buffer);
    //   });
    // });
    
  } catch (error) {
    console.error('生成PDF失败:', error);
    throw error;
  }
};

/**
 * 生成HTML内容
 */
const generateHTML = (analysisData, analysisType, userName) => {
  const timestamp = new Date().toLocaleString('zh-CN');
  
  let html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${getAnalysisTypeLabel(analysisType)}分析报告</title>
    <style>
        ${getCSS()}
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <div class="logo">
                <h1>神机阁</h1>
                <p>专业命理分析平台</p>
            </div>
            <div class="report-info">
                <h2>${getAnalysisTypeLabel(analysisType)}分析报告</h2>
                <p><strong>姓名：</strong>${userName || '用户'}</p>
                <p><strong>生成时间：</strong>${timestamp}</p>
            </div>
        </header>
        
        <main class="content">
  `;
  
  // 根据分析类型生成不同的HTML内容
  switch (analysisType) {
    case 'bazi':
      html += generateBaziHTML(analysisData);
      break;
    case 'ziwei':
      html += generateZiweiHTML(analysisData);
      break;
    case 'yijing':
      html += generateYijingHTML(analysisData);
      break;
  }
  
  html += `
        </main>
        
        <footer class="footer">
            <div class="disclaimer">
                <p><strong>免责声明：</strong></p>
                <p>本报告由神机阁AI命理分析平台生成，仅供参考，请理性对待。</p>
                <p>命理分析不能替代个人努力和理性决策。</p>
            </div>
            <div class="footer-info">
                <p>生成时间：${timestamp}</p>
                <p>© 2025 神机阁 - AI命理分析平台</p>
            </div>
        </footer>
    </div>
</body>
</html>
  `;
  
  return html;
};

/**
 * 生成八字命理HTML内容
 */
const generateBaziHTML = (analysisData) => {
  let html = '';
  
  // 基本信息
  if (analysisData.basic_info) {
    html += `
        <section class="section">
            <h3 class="section-title">📋 基本信息</h3>
            <div class="info-grid">
    `;
    
    if (analysisData.basic_info.personal_data) {
      const personal = analysisData.basic_info.personal_data;
      html += `
                <div class="info-item">
                    <label>姓名：</label>
                    <span>${personal.name || '未提供'}</span>
                </div>
                <div class="info-item">
                    <label>性别：</label>
                    <span>${personal.gender === 'male' ? '男' : personal.gender === 'female' ? '女' : personal.gender || '未提供'}</span>
                </div>
                <div class="info-item">
                    <label>出生日期：</label>
                    <span>${personal.birth_date || '未提供'}</span>
                </div>
                <div class="info-item">
                    <label>出生时间：</label>
                    <span>${personal.birth_time || '未提供'}</span>
                </div>
      `;
      
      if (personal.birth_place) {
        html += `
                <div class="info-item">
                    <label>出生地点：</label>
                    <span>${personal.birth_place}</span>
                </div>
        `;
      }
    }
    
    html += `
            </div>
    `;
    
    // 八字信息
    if (analysisData.basic_info.bazi_info) {
      const bazi = analysisData.basic_info.bazi_info;
      html += `
            <h4 class="subsection-title">🔮 八字信息</h4>
            <table class="bazi-table">
                <thead>
                    <tr>
                        <th>柱位</th>
                        <th>天干</th>
                        <th>地支</th>
                        <th>纳音</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>年柱</td>
                        <td>${bazi.year?.split('')[0] || '-'}</td>
                        <td>${bazi.year?.split('')[1] || '-'}</td>
                        <td>${bazi.year_nayin || '-'}</td>
                    </tr>
                    <tr>
                        <td>月柱</td>
                        <td>${bazi.month?.split('')[0] || '-'}</td>
                        <td>${bazi.month?.split('')[1] || '-'}</td>
                        <td>${bazi.month_nayin || '-'}</td>
                    </tr>
                    <tr>
                        <td>日柱</td>
                        <td>${bazi.day?.split('')[0] || '-'}</td>
                        <td>${bazi.day?.split('')[1] || '-'}</td>
                        <td>${bazi.day_nayin || '-'}</td>
                    </tr>
                    <tr>
                        <td>时柱</td>
                        <td>${bazi.hour?.split('')[0] || '-'}</td>
                        <td>${bazi.hour?.split('')[1] || '-'}</td>
                        <td>${bazi.hour_nayin || '-'}</td>
                    </tr>
                </tbody>
            </table>
      `;
    }
    
    html += `
        </section>
    `;
  }
  
  // 五行分析
  if (analysisData.wuxing_analysis) {
    html += `
        <section class="section">
            <h3 class="section-title">🌟 五行分析</h3>
    `;
    
    if (analysisData.wuxing_analysis.element_distribution) {
      html += `
            <h4 class="subsection-title">五行分布</h4>
            <table class="element-table">
                <thead>
                    <tr>
                        <th>五行</th>
                        <th>数量</th>
                        <th>占比</th>
                        <th>强度</th>
                    </tr>
                </thead>
                <tbody>
      `;
      
      const elements = analysisData.wuxing_analysis.element_distribution;
      const total = Object.values(elements).reduce((sum, count) => sum + (typeof count === 'number' ? count : 0), 0);
      
      Object.entries(elements).forEach(([element, count]) => {
        const numCount = typeof count === 'number' ? count : 0;
        const percentage = total > 0 ? Math.round((numCount / total) * 100) : 0;
        const strength = numCount >= 3 ? '旺' : numCount >= 2 ? '中' : '弱';
        html += `
                    <tr>
                        <td class="element-${element}">${element}</td>
                        <td>${numCount}</td>
                        <td>${percentage}%</td>
                        <td class="strength-${strength}">${strength}</td>
                    </tr>
        `;
      });
      
      html += `
                </tbody>
            </table>
      `;
    }
    
    if (analysisData.wuxing_analysis.balance_analysis) {
      html += `
            <div class="analysis-content">
                <h4 class="subsection-title">五行平衡分析</h4>
                <p>${analysisData.wuxing_analysis.balance_analysis}</p>
            </div>
      `;
    }
    
    if (analysisData.wuxing_analysis.suggestions) {
      html += `
            <div class="analysis-content">
                <h4 class="subsection-title">调和建议</h4>
                <p>${analysisData.wuxing_analysis.suggestions}</p>
            </div>
      `;
    }
    
    html += `
        </section>
    `;
  }
  
  // 格局分析
  if (analysisData.pattern_analysis) {
    html += `
        <section class="section">
            <h3 class="section-title">🎯 格局分析</h3>
            <div class="pattern-info">
    `;
    
    if (analysisData.pattern_analysis.main_pattern) {
      html += `
                <div class="info-item">
                    <label>主要格局：</label>
                    <span class="highlight">${analysisData.pattern_analysis.main_pattern}</span>
                </div>
      `;
    }
    
    if (analysisData.pattern_analysis.pattern_strength) {
      const strength = analysisData.pattern_analysis.pattern_strength;
      const strengthLabel = strength === 'strong' ? '强' : strength === 'moderate' ? '中等' : strength === 'fair' ? '一般' : '较弱';
      html += `
                <div class="info-item">
                    <label>格局强度：</label>
                    <span class="strength-${strength}">${strengthLabel}</span>
                </div>
      `;
    }
    
    if (analysisData.pattern_analysis.analysis) {
      html += `
                <div class="analysis-content">
                    <h4 class="subsection-title">格局详解</h4>
                    <p>${analysisData.pattern_analysis.analysis}</p>
                </div>
      `;
    }
    
    html += `
            </div>
        </section>
    `;
  }
  
  // 人生指导
  if (analysisData.life_guidance) {
    html += `
        <section class="section">
            <h3 class="section-title">🌟 人生指导</h3>
    `;
    
    if (analysisData.life_guidance.strengths) {
      html += `
            <div class="guidance-item">
                <h4 class="subsection-title">优势特质</h4>
                <div class="guidance-content">
      `;
      
      if (Array.isArray(analysisData.life_guidance.strengths)) {
        html += '<ul>';
        analysisData.life_guidance.strengths.forEach(strength => {
          html += `<li>${strength}</li>`;
        });
        html += '</ul>';
      } else {
        html += `<p>${analysisData.life_guidance.strengths}</p>`;
      }
      
      html += `
                </div>
            </div>
      `;
    }
    
    if (analysisData.life_guidance.challenges) {
      html += `
            <div class="guidance-item">
                <h4 class="subsection-title">需要注意</h4>
                <div class="guidance-content">
      `;
      
      if (Array.isArray(analysisData.life_guidance.challenges)) {
        html += '<ul>';
        analysisData.life_guidance.challenges.forEach(challenge => {
          html += `<li>${challenge}</li>`;
        });
        html += '</ul>';
      } else {
        html += `<p>${analysisData.life_guidance.challenges}</p>`;
      }
      
      html += `
                </div>
            </div>
      `;
    }
    
    if (analysisData.life_guidance.overall_summary) {
      html += `
            <div class="guidance-item">
                <h4 class="subsection-title">综合总结</h4>
                <div class="guidance-content">
                    <p>${analysisData.life_guidance.overall_summary}</p>
                </div>
            </div>
      `;
    }
    
    html += `
        </section>
    `;
  }
  
  return html;
};

/**
 * 生成紫微斗数HTML内容
 */
const generateZiweiHTML = (analysisData) => {
  let html = '';
  
  // 基本信息
  if (analysisData.basic_info) {
    html += `
        <section class="section">
            <h3 class="section-title">📋 基本信息</h3>
            <div class="info-grid">
    `;
    
    if (analysisData.basic_info.personal_data) {
      const personal = analysisData.basic_info.personal_data;
      html += `
                <div class="info-item">
                    <label>姓名：</label>
                    <span>${personal.name || '未提供'}</span>
                </div>
                <div class="info-item">
                    <label>性别：</label>
                    <span>${personal.gender === 'male' ? '男' : personal.gender === 'female' ? '女' : personal.gender || '未提供'}</span>
                </div>
                <div class="info-item">
                    <label>出生日期：</label>
                    <span>${personal.birth_date || '未提供'}</span>
                </div>
                <div class="info-item">
                    <label>出生时间：</label>
                    <span>${personal.birth_time || '未提供'}</span>
                </div>
      `;
    }
    
    // 紫微基本信息
    if (analysisData.basic_info.ziwei_info) {
      const ziwei = analysisData.basic_info.ziwei_info;
      if (ziwei.ming_gong) {
        html += `
                <div class="info-item">
                    <label>命宫：</label>
                    <span class="highlight">${ziwei.ming_gong}</span>
                </div>
        `;
      }
      if (ziwei.wuxing_ju) {
        html += `
                <div class="info-item">
                    <label>五行局：</label>
                    <span class="highlight">${ziwei.wuxing_ju}</span>
                </div>
        `;
      }
      if (ziwei.main_stars) {
        html += `
                <div class="info-item">
                    <label>主星：</label>
                    <span class="highlight">${Array.isArray(ziwei.main_stars) ? ziwei.main_stars.join('、') : ziwei.main_stars}</span>
                </div>
        `;
      }
    }
    
    html += `
            </div>
        </section>
    `;
  }
  
  // 星曜分析
  if (analysisData.star_analysis) {
    html += `
        <section class="section">
            <h3 class="section-title">⭐ 星曜分析</h3>
    `;
    
    if (analysisData.star_analysis.main_stars) {
      html += `
            <h4 class="subsection-title">主星分析</h4>
            <div class="star-analysis">
      `;
      
      if (Array.isArray(analysisData.star_analysis.main_stars)) {
        analysisData.star_analysis.main_stars.forEach(star => {
          if (typeof star === 'object') {
            html += `
                    <div class="star-item">
                        <h5>${star.name || star.star}</h5>
            `;
            if (star.brightness) {
              html += `<p><strong>亮度：</strong>${star.brightness}</p>`;
            }
            if (star.influence) {
              html += `<p><strong>影响：</strong>${star.influence}</p>`;
            }
            if (star.description) {
              html += `<p><strong>特质：</strong>${star.description}</p>`;
            }
            html += `
                    </div>
            `;
          }
        });
      } else {
        html += `<p>${analysisData.star_analysis.main_stars}</p>`;
      }
      
      html += `
            </div>
      `;
    }
    
    html += `
        </section>
    `;
  }
  
  return html;
};

/**
 * 生成易经占卜HTML内容
 */
const generateYijingHTML = (analysisData) => {
  let html = '';
  
  // 占卜问题
  if (analysisData.question_analysis) {
    html += `
        <section class="section">
            <h3 class="section-title">❓ 占卜问题</h3>
            <div class="question-info">
    `;
    
    if (analysisData.question_analysis.original_question) {
      html += `
                <div class="info-item">
                    <label>问题：</label>
                    <span class="highlight">${analysisData.question_analysis.original_question}</span>
                </div>
      `;
    }
    
    if (analysisData.question_analysis.question_type) {
      html += `
                <div class="info-item">
                    <label>问题类型：</label>
                    <span>${analysisData.question_analysis.question_type}</span>
                </div>
      `;
    }
    
    html += `
            </div>
        </section>
    `;
  }
  
  // 卦象信息
  if (analysisData.hexagram_info) {
    html += `
        <section class="section">
            <h3 class="section-title">🔮 卦象信息</h3>
    `;
    
    if (analysisData.hexagram_info.main_hexagram) {
      const main = analysisData.hexagram_info.main_hexagram;
      html += `
            <div class="hexagram-item">
                <h4 class="subsection-title">主卦</h4>
                <div class="hexagram-info">
                    <div class="info-item">
                        <label>卦名：</label>
                        <span class="highlight">${main.name || '未知'}</span>
                    </div>
                    <div class="info-item">
                        <label>卦象：</label>
                        <span class="hexagram-symbol">${main.symbol || ''}</span>
                    </div>
      `;
      
      if (main.number) {
        html += `
                    <div class="info-item">
                        <label>卦序：</label>
                        <span>第${main.number}卦</span>
                    </div>
        `;
      }
      
      if (main.meaning) {
        html += `
                    <div class="info-item">
                        <label>含义：</label>
                        <span>${main.meaning}</span>
                    </div>
        `;
      }
      
      html += `
                </div>
            </div>
      `;
    }
    
    html += `
        </section>
    `;
  }
  
  return html;
};

/**
 * 获取分析类型标签
 */
const getAnalysisTypeLabel = (analysisType) => {
  switch (analysisType) {
    case 'bazi': return '八字命理';
    case 'ziwei': return '紫微斗数';
    case 'yijing': return '易经占卜';
    default: return '命理';
  }
};

/**
 * 获取CSS样式
 */
const getCSS = () => {
  return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f9f9f9;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header .logo h1 {
            font-size: 2.5em;
            margin-bottom: 5px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header .logo p {
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        .header .report-info {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(255,255,255,0.3);
        }
        
        .header .report-info h2 {
            font-size: 1.8em;
            margin-bottom: 10px;
        }
        
        .content {
            padding: 30px;
        }
        
        .section {
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 1px solid #eee;
        }
        
        .section:last-child {
            border-bottom: none;
        }
        
        .section-title {
            font-size: 1.5em;
            color: #dc2626;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #dc2626;
        }
        
        .subsection-title {
            font-size: 1.2em;
            color: #b91c1c;
            margin: 20px 0 10px 0;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .info-item {
            display: flex;
            align-items: center;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        
        .info-item label {
            font-weight: bold;
            margin-right: 10px;
            min-width: 80px;
        }
        
        .highlight {
            color: #dc2626;
            font-weight: bold;
        }
        
        .bazi-table, .element-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        
        .bazi-table th, .bazi-table td,
        .element-table th, .element-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: center;
        }
        
        .bazi-table th, .element-table th {
            background: #dc2626;
            color: white;
            font-weight: bold;
        }
        
        .bazi-table tr:nth-child(even),
        .element-table tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        .element-木 { color: #22c55e; font-weight: bold; }
        .element-火 { color: #ef4444; font-weight: bold; }
        .element-土 { color: #eab308; font-weight: bold; }
        .element-金 { color: #64748b; font-weight: bold; }
        .element-水 { color: #3b82f6; font-weight: bold; }
        
        .strength-旺 { color: #22c55e; font-weight: bold; }
        .strength-中 { color: #eab308; font-weight: bold; }
        .strength-弱 { color: #ef4444; font-weight: bold; }
        
        .strength-strong { color: #22c55e; font-weight: bold; }
        .strength-moderate { color: #eab308; font-weight: bold; }
        .strength-fair { color: #f97316; font-weight: bold; }
        .strength-weak { color: #ef4444; font-weight: bold; }
        
        .analysis-content {
            margin: 20px 0;
            padding: 20px;
            background: #f8f9fa;
            border-left: 4px solid #dc2626;
            border-radius: 0 5px 5px 0;
        }
        
        .guidance-item {
            margin: 20px 0;
            padding: 20px;
            background: #fff7ed;
            border-radius: 8px;
            border: 1px solid #fed7aa;
        }
        
        .guidance-content ul {
            margin-left: 20px;
        }
        
        .guidance-content li {
            margin: 8px 0;
        }
        
        .star-analysis {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .star-item {
            padding: 15px;
            background: #f1f5f9;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
        }
        
        .star-item h5 {
            color: #1e40af;
            margin-bottom: 10px;
            font-size: 1.1em;
        }
        
        .hexagram-item {
            margin: 20px 0;
            padding: 20px;
            background: #fef3c7;
            border-radius: 8px;
            border: 1px solid #fbbf24;
        }
        
        .hexagram-symbol {
            font-family: monospace;
            font-size: 1.2em;
            font-weight: bold;
            color: #92400e;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 30px;
            border-top: 1px solid #eee;
        }
        
        .disclaimer {
            margin-bottom: 20px;
            padding: 20px;
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
        }
        
        .disclaimer p {
            margin: 5px 0;
        }
        
        .footer-info {
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }
        
        .footer-info p {
            margin: 5px 0;
        }
        
        @media print {
            body {
                background: white;
            }
            
            .container {
                box-shadow: none;
            }
        }
    `;
};

module.exports = {
  generatePDF
};