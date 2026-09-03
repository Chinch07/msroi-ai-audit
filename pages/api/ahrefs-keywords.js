import { requireSession } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  // Internal-only endpoint (Ahrefs spend). The public /free-audit flow never
  // calls this — only the authenticated internal tool does.
  if (!requireSession(req, res)) return;
  const mcpKey = process.env.AHREFS_MCP_KEY;
  if (!mcpKey) return res.status(200).json({ items: [] });
  try {
    const { keywords } = req.body;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'mcp-client-2025-04-04',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        mcp_servers: [{ type: 'url', url: 'https://api.ahrefs.com/mcp/mcp', name: 'ahrefs', authorization_token: mcpKey }],
        messages: [{ role: 'user', content: `Use Ahrefs keywords explorer to get metrics for: ${keywords || ''}\n\nReturn ONLY a JSON array (no markdown):\n[{"keyword": "text", "volume": "2400/mo", "difficulty": 45, "intent": "informational"}, ...]\nReal Ahrefs data only. Difficulty = 0-100 integer.` }]
      })
    });
    const data = await response.json();
    const textBlocks = (data.content || []).filter(b => b.type === 'text');
    const raw = textBlocks.map(b => b.text).join('').replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim();
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return res.status(200).json({ items: [] });
    return res.status(200).json({ items: JSON.parse(match[0]) });
  } catch (err) {
    return res.status(200).json({ items: [] });
  }
}
