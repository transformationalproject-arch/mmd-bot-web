import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { role } = req.query;
    let query = supabase.from("conversations").select("*").order("updated_at", { ascending: false });
    if (role) query = query.eq("role", role);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    const { id, role, title, messages } = req.body;
    if (id) {
      const { data, error } = await supabase
        .from("conversations")
        .update({ messages, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data[0]);
    } else {
      const { data, error } = await supabase
        .from("conversations")
        .insert({ role, title, messages })
        .select();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data[0]);
    }
  }

  if (req.method === "DELETE") {
    const { id } = req.query;
    const { error } = await supabase.from("conversations").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: "Method not allowed" });
}
