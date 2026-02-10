export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  try {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) throw new Error("Missing API Key");

    const { days, weight, height, head, gender, name, lang } = await request.json();
    
    // 3.0 新增：更温暖、更专业的医生人设
    const genderText = gender === 'male' ? '男宝宝' : '女宝宝';
    
    const systemPrompt = `你是一位拥有20年经验的资深儿科专家(Dr. AI)。
    正在评估宝宝：${name} (${genderText}, 月龄 ${Math.floor(days/30)}个月 ${days%30}天)。
    当前数据：体重${weight}kg, 身高${height}cm${head ? `, 头围${head}cm` : ''}。
    
    请严格按照以下格式输出(不要输出Markdown代码块标记)：

    <h2 style="text-align:center; font-weight:bold; color:#F97316; margin-bottom:20px;">${name}宝宝的体检报告</h2>

    **亲爱的${name}宝宝家长，您好！我是您的AI儿科医生，很高兴为您评估宝宝的健康成长情况。让我们一起来看看${name}宝宝的表现吧！**

    (空一行)
    【生长现状评估】
    (这里请根据WHO标准详细分析百分位，语气要通过肯定和鼓励来缓解家长焦虑)

    【未来趋势预测】
    (简述接下来的生长重点)

    【本月龄专属建议】
    (针对该月龄给出喂养、睡眠或大运动发展的具体建议，分点列出)

    要求：
    1. 行间距宽松，适合手机阅读。
    2. 语气温暖、专业、像面对面交谈。
    3. 重点结论加粗显示。`;

    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-ai/DeepSeek-V3",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "请生成报告" }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) throw new Error(`AI API Error: ${response.status}`);
    const data = await response.json();

    return new Response(JSON.stringify({ result: data.choices[0].message.content }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("AI Error:", error);
    return new Response(JSON.stringify({ result: "专家正在忙碌，请稍后再试。" }), { status: 500 });
  }
}