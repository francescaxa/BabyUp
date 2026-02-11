// api/analyze.js
export const config = {
  runtime: 'edge', // 使用 Edge 模式，速度更快
};

export default async function handler(req) {
  try {
    // 1. 获取前端传来的数据
    const { days, weight, height, head, gender, name, lang } = await req.json();

    // 🔴🔴🔴 关键修复：请在这里直接填入您的 API Key 🔴🔴🔴
    // 把引号里的内容换成您真实的密钥 (sk-or-v1-xxxx...)
    // 如果您已经配置了 Vercel 环境变量，可以改回 process.env.AI_API_KEY
    const API_KEY = "sk-nxqwldyuuddcdtuooxrzijjtwzvpgyyqdenfibwdwrsljxqd"; 

    // 检查是否填了 Key，没填就报错
    if (!API_KEY || API_KEY.includes('在这里粘贴')) {
      throw new Error('API Key is missing. Please edit api/analyze.js to add your key.');
    }

    // 2. 设定中英文模式 (使用 V5.1 的优化版 Prompt，确保格式对齐)
    const isEnglish = lang === 'en';
    
    const systemPrompt = isEnglish 
      ? `You are an empathetic, professional AI Pediatrician named "BabyUp Expert". 
         Tone: Warm, encouraging, yet scientifically accurate (based on WHO standards).
         
         FORMATTING RULES (Strict):
         1. Use standard Markdown.
         2. Use **Bold** for key status (e.g., **Normal**, **High**).
         3. Structure the report exactly with these 3 headings:
            ### 1. Growth Assessment 📊
            ### 2. What to Expect Next 🚀
            ### 3. Expert Advice for this Month 💡
         4. Do NOT output plain text blocks; use bullet points.` 
      : `你是一位专业且温暖的 AI 儿科医生，名字叫“BabyUp 专家”。
         基调：温暖、令人放心，同时基于 WHO 标准保持科学严谨。
         
         排版规则 (严格执行)：
         1. 必须使用标准 Markdown 语法。
         2. 关键结论必须使用 **加粗**（例如：**完全达标**）。
         3. 请严格按照以下 3 个标题输出：
            ### 1. 生长现状评估 📊
            ### 2. 未来趋势预测 🚀
            ### 3. 本月龄专属建议 💡
         4. 必须使用列表项展示细节，禁止大段纯文本。`;

    const userPrompt = isEnglish
      ? `Baby: ${name}, ${gender}, ${days} days old. Data: Weight ${weight}kg, Height ${height}cm, Head ${head || 'N/A'}. Analyze based on WHO standards.`
      : `宝宝：${name}，${gender}，${days}天大。数据：体重${weight}kg，身高${height}cm，头围${head || '无'}。请基于WHO标准进行评估。`;

    // 3. 发送请求给 AI (OpenRouter)
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`, // 这里会自动使用上面定义的 Key
        'HTTP-Referer': 'https://babyup.app',
        'X-Title': 'BabyUp',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001', // 或者 'deepseek/deepseek-chat'
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7, // 温度设为 0.7，既有创造力又不太飘
      }),
    });

    // 4. 处理 API 返回的错误 (比如 Key 不对，或者余额不足)
    if (!response.ok) {
      const errorData = await response.json();
      console.error('AI API Error Details:', errorData);
      throw new Error(`AI Service Error: ${response.status}`);
    }

    const data = await response.json();
    const aiText = data.choices?.[0]?.message?.content || (isEnglish ? "Report generation failed." : "报告生成失败。");

    // 5. 返回成功结果
    return new Response(JSON.stringify({ result: aiText }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Handler Error:', error);
    // 返回一个 JSON 错误，防止前端白屏
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}