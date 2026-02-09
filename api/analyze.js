export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const { days, weight, height, head, gender, name } = await request.json();

  const genderText = gender === 'male' ? '男宝宝' : '女宝宝';
  
  const systemPrompt = `你是一位拥有20年经验的儿科专家。
  正在评估宝宝：${name} (${genderText}, 月龄 ${days}天)。
  当前数据：体重${weight}kg, 身高${height}cm${head ? `, 头围${head}cm` : ''}。
  
  请基于WHO标准进行评估。
  输出要求：
  1. 语气亲切、带有鼓励性，称呼宝宝名字。
  2. 包含【生长现状】(指出百分位水平)、【未来趋势预测】、【本月龄专属建议】。
  3. 必须使用 Markdown 格式，重要结论加粗。`;

  try {
    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-ai/DeepSeek-V3",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "请生成体检报告。" }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    return new Response(JSON.stringify({ result: data.choices[0].message.content }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ result: "专家正在忙碌，请稍后再试。" }), { status: 500 });
  }
}