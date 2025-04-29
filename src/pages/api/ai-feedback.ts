import type { NextApiRequest, NextApiResponse } from 'next';

// Anthropic Claude API endpoint
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { subject, avgPercent, reflections } = req.body;
  if (!subject || typeof avgPercent !== 'number' || !Array.isArray(reflections)) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }

  // Compose prompt for Claude
  const prompt = `다음은 학생의 SMART 목표와 최근 7일간 학습 기록입니다.\n\n목표: ${subject}\n최근 7일 평균 달성률: ${avgPercent}%\n최근 반성문:\n${reflections.length > 0 ? reflections.map((r, i) => `${i+1}. ${r}`).join('\n') : '반성문 없음'}\n\n학생에게 동기부여가 될 수 있도록 칭찬과 개선점을 2~3문장으로 한국어로 작성해 주세요. 너무 딱딱하지 않게 응원 메시지도 포함해 주세요.`;

  try {
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      res.status(500).json({ error: 'Anthropic API key not configured.' });
      return;
    }
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 256,
        messages: [
          { "role": "user", "content": prompt }
        ],
        temperature: 0.7
      })
    });
    if (!response.ok) {
      const err = await response.text();
      res.status(500).json({ error: 'Anthropic API error', detail: err });
      return;
    }
    const data = await response.json();
    const aiMessage = data.content?.[0]?.text || '';
    res.status(200).json({ feedback: aiMessage });
  } catch (error) {
    res.status(500).json({ error: 'AI 피드백 생성 실패', detail: String(error) });
  }
}
