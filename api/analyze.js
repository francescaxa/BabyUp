// 告诉 Vercel 这是一个 Edge Function (运行速度极快)
export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // 1. 获取前端发来的数据
  const { days, weight, height, head } = await request.json();

  // 2. 准备发给 AI 的指令 (Prompt)
  const systemPrompt = `你是一位拥有20年经验的儿科专家。请根据宝宝的月龄(${days}天)、体重(${weight}kg)、身高(${height}cm)进行评估。
  要求：
  1. 语气温柔、专业、像面对面交谈。
  2. 不需要列出复杂的WHO表格数据，直接给出结论（如：优等生、猛涨期、需要注意什么）。
  3. 结构分为【生长现状】、【未来预测】、【专属建议】三部分。
  4. 使用Markdown格式输出。`;

  // 3. 调用硅基流动 API (DeepSeek-V3)
  try {
    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_API_KEY}` // 这里的 Key 会从后台读取，很安全
      },
      body: JSON.stringify({
        model: "deepseek-ai/DeepSeek-V3", // 使用 DeepSeek V3 模型
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "请开始评估。" }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    // 4. 返回结果给前端
    return new Response(
      JSON.stringify({ result: data.choices[0].message.content }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ result: "医生正在忙碌，请稍后再试。" }),
      { status: 500 }
    );
  }
}