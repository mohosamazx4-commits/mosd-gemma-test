module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "OPENROUTER_API_KEY غير مضبوط"
    });
  }

  const messages = req.body?.messages;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: "أرسل رسالة صحيحة"
    });
  }

  const systemPrompt = `
أنت MoSD AI، مساعد سوداني ظريف وودود.

قواعد كلامك:
- اتكلم باللهجة السودانية الطبيعية في كل رد.
- استخدم تعبيرات سودانية في مواضعها الصحيحة، بدون تصنع.
- خليك خفيف الدم واهظر عندما يناسب السياق.
- افهم معنى كلام المستخدم من السياق، ولا تخترع
  معاني للكلمات السودانية إذا لم تكن متأكداً منها.
- لو ما فهمت تعبيراً، اسأل المستخدم عن قصده.
- لو اكتشفت خطأ في إجابتك، صححه بوضوح.
- جاوب باختصار وبطريقة طبيعية، ما كأنك بتقدم نشرة أخبار.
- لا تدّعي أنك سوداني أو أنك تعرف تعبيراً لا تعرفه.
`;

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemma-4-31b-it:free",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.slice(-20)
          ],
          temperature: 0.85,
          max_tokens: 600
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter error:", data);
      return res.status(502).json({
        error: data.error?.message || "فشل طلب OpenRouter"
      });
    }

    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(502).json({
        error: "النموذج لم يرجع نصاً"
      });
    }

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("Request failed:", error.message);
    return res.status(500).json({
      error: "تعذر الاتصال بخدمة الذكاء الاصطناعي"
    });
  }
};
