// Analisa sentimen berbasis kamus (Indonesia + Inggris), tanpa layanan eksternal.
// Menangani negasi ("tidak bagus"), penguat ("bagus banget"), dan atribusi topik per klausa.
const POS = "bagus baik mantap mantul keren puas recommended rekomen recommend murah cepat rapi aman original ori asli sesuai awet nyaman halus wangi suka cocok worth terbaik top oke ok ramah responsif memuaskan bersih tebal kuat lembut cantik lengkap berkualitas good great love nice perfect best fast thanks makasih sip joss lancar mulus gercep keceh kece amanah terpercaya trusted juara bgus bgs recomended recomend rekomended okey emojipos".split(" ");
const NEG = "jelek buruk kecewa rusak cacat lama lambat telat terlambat mahal palsu kw tipu penipu bohong bau kotor tipis sobek pecah bocor penyok salah lecet luntur mengecewakan parah zonk nyesel menyesal gagal error retak patah mati hancur ribet bad worst broken fake slow late lecet kasar apek berjamur ngaret nipu kapok jeblok abal ampas sampah ngecewain kecewain bobrok amburadul remuk kekecilan kebesaran cacad pelit jutek cuek lemot bete jlek jlk emojineg".split(" ");
const NEGATORS = new Set("tidak tak gak ga nggak ngga enggak bukan kurang belum no not tanpa ndak nda tdk gk gaa nggk".split(" "));
const BOOST_BEFORE = new Set(["sangat", "very", "super", "terlalu"]);
const BOOST_AFTER = new Set(["banget", "bgt", "sekali", "parah", "bngt", "bnget", "amat", "pol"]);
const POSS = new Set(POS), NEGS = new Set(NEG);

export const TOPICS = {
  kualitas: "kualitas bahan awet rusak cacat tipis tebal kuat patah retak luntur jahitan material produk barang abal ampas bobrok remuk".split(" "),
  pengiriman: "kirim pengiriman ekspedisi kurir sampai lama cepat telat terlambat paket resi estimasi ngaret jne jnt sicepat anteraja spx".split(" "),
  kemasan: "packing kemasan bungkus dus bubble rapi penyok bocor pecah box".split(" "),
  harga: "harga murah mahal worth diskon promo ongkir".split(" "),
  pelayanan: "seller penjual admin respon responsif ramah pelayanan cs toko gercep jutek cuek".split(" "),
  kesesuaian: "sesuai ukuran warna deskripsi foto gambar size beda salah original ori asli palsu kw kekecilan kebesaran".split(" ")
};
const TOPIC_OF = {};
for (const [t, ws] of Object.entries(TOPICS)) for (const w of ws) (TOPIC_OF[w] ??= []).push(t);

const tokenize = s => s.toLowerCase().replace(/[👍❤😍🥰👌💯]/gu, " emojipos ").replace(/[👎😡😠😤🤬😢😭]/gu, " emojineg ").replace(/(.)\1{2,}/g, "$1").replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
const label = s => (s >= 0.15 ? "positif" : s <= -0.15 ? "negatif" : "netral");

function clauseScore(tokens) {
  let raw = 0;
  tokens.forEach((w, i) => {
    let v = POSS.has(w) ? 1 : NEGS.has(w) ? -1 : 0;
    if (!v) return;
    if (NEGATORS.has(tokens[i - 1]) || NEGATORS.has(tokens[i - 2])) v = -v * 0.8;
    if (BOOST_BEFORE.has(tokens[i - 1]) || BOOST_AFTER.has(tokens[i + 1])) v *= 1.5;
    raw += v;
  });
  return raw;
}

export function analyze(text, rating = null) {
  const clauses = String(text || "").split(/[.,!?;\n]+|\b(?:tapi|namun|but|sayangnya)\b/i).map(tokenize).filter(c => c.length);
  let total = 0; const topicScores = {};
  for (const c of clauses) {
    const s = clauseScore(c); total += s;
    if (s === 0) continue;
    for (const w of c) for (const t of TOPIC_OF[w] || []) (topicScores[t] ??= []).push(s);
  }
  let score = total / (Math.abs(total) + 1.5), source = "teks";
  if (total === 0) {
    source = "rating";
    score = rating == null ? 0 : rating >= 4 ? 0.3 : rating <= 2 ? -0.3 : 0;
  }
  const topics = Object.entries(topicScores).map(([topic, a]) => ({ topic, label: label(a.reduce((x, y) => x + y, 0)) })).filter(t => t.label !== "netral");
  return { score: Number(score.toFixed(3)), label: label(score), topics, source };
}
