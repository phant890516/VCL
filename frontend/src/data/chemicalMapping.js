
export const KEYS = {
    NAME: ["Name", "名称", "name"],
    EN_NAME: ["EnglishName", "英語名", "englishName"],
    APP: ["Appearance", "外観", "appearance"],
    MP: ["MeltingPoint", "融点", "meltingPoint"],
    BP: ["BoilingPoint", "沸点", "boilingPoint"],
    MW: ["MolecularWeight", "分子量", "molecularWeight"],
    GHS: ["GHSClassification", "GHS分類", "ghsClassification"],
    CID: ["CID", "PubChem_CID", "cid"]
};

// 色のマッピング辞書
export const COLOR_KEYWORDS = {
    "無色": 0xffffff, "透明": 0xffffff, "Colorless": 0xffffff, "Clear": 0xffffff,
    "白": 0xffffff, "White": 0xffffff,
    "黒": 0x333333, "Black": 0x333333,
    "赤": 0xff0000, "Red": 0xff0000,
    "青": 0x0000ff, "Blue": 0x0000ff,
    "黄": 0xffff00, "Yellow": 0xffff00, "Amber": 0xffbf00, "Pale yellow": 0xffffcc, "淡黄色": 0xffffcc, "Yellowish": 0xffffcc,
    "緑": 0x008000, "Green": 0x008000,
    "橙": 0xffa500, "Orange": 0xffa500,
    "紫": 0x800080, "Purple": 0x800080, "Violet": 0xee82ee,
    "茶": 0x8b4513, "Brown": 0x8b4513, "褐色": 0x8b4513,
    "銀": 0xc0c0c0, "Silver": 0xc0c0c0, "灰": 0x808080, "Gray": 0x808080, "Grey": 0x808080,
    "ピンク": 0xffc0cb, "Pink": 0xffc0cb, "桃": 0xffc0cb,
    "金": 0xffd700, "Gold": 0xffd700,
    "錫白色": 0xddeeff,
    "白金": 0xe5e4e2
};

// 元素ごとの固有定義
export const ELEMENT_SPECIFIC_DATA = {
    "水素": { type: "gas", color: null },
    "ヘリウム": { type: "gas", color: null },
    "リチウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "ベリリウム": { type: "metal_ingot", color: 0xcccccc },
    "ホウ素": { type: "solid_powder", color: 0x333333 },
    "炭素": { type: "solid_powder", color: 0x111111 },
    "窒素": { type: "gas", color: null },
    "酸素": { type: "gas", color: null },
    "フッ素": { type: "gas", color: 0xffffcc },
    "ネオン": { type: "gas", color: null },
    "ナトリウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "マグネシウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "アルミニウム": { type: "metal_ingot", color: 0xddeeff },
    "ケイ素": { type: "metal_ingot", color: 0x444466 },
    "リン": { type: "solid_powder", color: 0x8b0000 },
    "硫黄": { type: "solid_powder", color: 0xffff00 },
    "塩素": { type: "gas", color: 0xccffcc },
    "アルゴン": { type: "gas", color: null },
    "カリウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "カルシウム": { type: "metal_ingot", color: 0xcccccc },
    "スカンジウム": { type: "metal_ingot", color: 0xcccccc },
    "チタン": { type: "metal_ingot", color: 0xaaaaaa },
    "バナジウム": { type: "metal_ingot", color: 0xaaaaaa },
    "クロム": { type: "metal_ingot", color: 0xaaaaaa },
    "マンガン": { type: "metal_ingot", color: 0xaaaaaa },
    "鉄": { type: "metal_ingot", color: 0x888888 },
    "コバルト": { type: "metal_ingot", color: 0xaaaaaa },
    "ニッケル": { type: "metal_ingot", color: 0xcccccc },
    "銅": { type: "metal_ingot", color: 0xb87333 },
    "亜鉛": { type: "metal_ingot", color: 0xaaaaaa },
    "ガリウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "ゲルマニウム": { type: "metal_ingot", color: 0x666666 },
    "ヒ素": { type: "solid_crystal", color: 0x888888 },
    "セレン": { type: "solid_powder", color: 0x333333 },
    "臭素": { type: "liquid", color: 0x8b0000 },
    "クリプトン": { type: "gas", color: null },
    "ルビジウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "ストロンチウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "イットリウム": { type: "metal_ingot", color: 0xcccccc },
    "ジルコニウム": { type: "metal_ingot", color: 0xcccccc },
    "ニオブ": { type: "metal_ingot", color: 0xcccccc },
    "モリブデン": { type: "metal_ingot", color: 0xcccccc },
    "テクネチウム": { type: "metal_ingot", color: 0xcccccc },
    "ルテニウム": { type: "metal_ingot", color: 0xcccccc },
    "ロジウム": { type: "metal_ingot", color: 0xcccccc },
    "パラジウム": { type: "metal_ingot", color: 0xcccccc },
    "銀": { type: "metal_ingot", color: 0xc0c0c0 },
    "カドミウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "インジウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "スズ": { type: "metal_ingot", color: 0xc0c0c0 },
    "アンチモン": { type: "metal_ingot", color: 0xc0c0c0 },
    "テルル": { type: "solid_crystal", color: 0xcccccc },
    "ヨウ素": { type: "solid_crystal", color: 0x330033 },
    "キセノン": { type: "gas", color: null },
    "セシウム": { type: "metal_ingot", color: 0xffd700 },
    "バリウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "ランタン": { type: "metal_ingot", color: 0xc0c0c0 },
    "セリウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "プラセオジム": { type: "metal_ingot", color: 0xc0c0c0 },
    "ネオジム": { type: "metal_ingot", color: 0xc0c0c0 },
    "プロメチウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "サマリウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "ユウロピウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "ガドリニウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "テルビウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "ジスプロシウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "ホルミウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "エルビウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "ツリウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "イッテルビウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "ルテチウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "ハフニウム": { type: "metal_ingot", color: 0xcccccc },
    "タンタル": { type: "metal_ingot", color: 0x444455 },
    "タングステン": { type: "metal_ingot", color: 0xcccccc },
    "レニウム": { type: "metal_ingot", color: 0xcccccc },
    "オスミウム": { type: "metal_ingot", color: 0xaaaaee },
    "イリジウム": { type: "metal_ingot", color: 0xccccc0 },
    "白金": { type: "metal_ingot", color: 0xe5e4e2 },
    "金": { type: "metal_ingot", color: 0xffd700 },
    "水銀": { type: "liquid", color: 0xc0c0c0 },
    "タリウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "鉛": { type: "metal_ingot", color: 0x888888 },
    "ビスマス": { type: "metal_ingot", color: 0xffcccc },
    "ポロニウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "アスタチン": { type: "solid_crystal", color: 0x111111 },
    "ラドン": { type: "gas", color: null },
    "フランシウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "ラジウム": { type: "metal_ingot", color: 0xffffff },
    "アクチニウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "トリウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "プロトアクチニウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "ウラン": { type: "metal_ingot", color: 0xc0c0c0 },
    "ネプツニウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "プルトニウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "アメリシウム": { type: "metal_ingot", color: 0xc0c0c0 }
};

export const METAL_KEYWORDS = ["metal", "alloy", "ingot", "金属"];

export function getValue(chem, keyArray) {
    if (!Array.isArray(keyArray)) return chem[keyArray];
    for (const k of keyArray) {
        if (chem[k] !== undefined && chem[k] !== null && chem[k] !== "")
          return chem[k];
    }
    return null;
}

export function parseColor(text) {
    if (!text) return 0xcccccc;
    if (text.includes("錫白色")) return 0xddeeff;
    if (text.includes("白金")) return 0xe5e4e2;
    let safeText = text.replace(/金属/g, "METAL_GENERIC");
    let foundHex = 0xcccccc;
    let matched = false;
    for (const [key, hex] of Object.entries(COLOR_KEYWORDS)) {
        if (safeText.includes(key)) {
            foundHex = hex;
            matched = true;
        }
    }
    if (safeText.includes("無色") || safeText.includes("Colorless")) return 0xffffff;
    if (safeText.includes("青み")) return 0xaaccff;
    return matched ? foundHex : 0xeeeeee;
}

export function isTransparent(text) {
    if (!text) return false;
    return text.includes("無色") || text.includes("Colorless") || text.includes("透明") || text.includes("Clear") || text.includes("液体");
}

export function determineType(chem) {
    const name = (getValue(chem, KEYS.NAME) || "").trim();
    const app = (getValue(chem, KEYS.APP) || "").toLowerCase();
    const enName = (getValue(chem, KEYS.EN_NAME) || "").trim();

    if (ELEMENT_SPECIFIC_DATA[name]) return ELEMENT_SPECIFIC_DATA[name].type;

    const nameLower = name.toLowerCase();
    const enNameLower = enName.toLowerCase();
    const metals = ["iron", "copper", "aluminum", "aluminium", "zinc", "silver", "gold", "lead", "tin", "magnesium", "nickel", "cobalt", "chromium", "manganese", "titanium", "uranium", "plutonium", "鉄", "銅", "アルミニウム", "亜鉛", "銀", "金", "鉛", "スズ", "マグネシウム", "ニッケル", "コバルト", "クロム", "マンガン", "チタン", "ウラン", "プルトニウム"];
    const nonMetalKeywords = ["oxide", "sulfate", "chloride", "nitrate", "carbonate", "hydroxide", "acid", "water", "solution", "酸化", "硫酸", "塩化", "硝酸", "炭酸", "水酸化", "酸", "水"];

    let isMetalName = false;
    for (const m of metals) {
        if (nameLower.includes(m) || enNameLower.includes(m)) {
            isMetalName = true;
            break;
        }
    }
    if (!isMetalName) {
         for (const k of METAL_KEYWORDS) {
             if (app.includes(k)) {
                 isMetalName = true;
                 break;
             }
         }
    } else if (!isMetalName && (app.includes("金属") || app.includes("metal"))) {
        isMetalName = true;
    }

    if (isMetalName) {
        let isCompound = false;
        for (const nm of nonMetalKeywords) {
            if (nameLower.includes(nm) || enNameLower.includes(nm)) {
                isCompound = true; break;
            }
        }
        if (app.includes("liquid") || app.includes("solution") || app.includes("液体") || app.includes("水溶液")) {
                isCompound = true;
        }
        if (!isCompound) return "metal_ingot";
    }

    if (app.includes("liquid") || app.includes("solution") || app.includes("液体") || app.includes("水溶液")) {
        return "liquid";
    }

    if (nameLower.includes("hydroxide") || nameLower.includes("水酸化") || app.includes("pellet") || app.includes("粒") || app.includes("granule")) {
            return "solid_pellet";
    }

    if (app.includes("crystal") || app.includes("結晶") || nameLower.includes("sulfate") || nameLower.includes("chloride") || nameLower.includes("nitrate") || nameLower.includes("salt") || nameLower.includes("sugar") || nameLower.includes("alum") || nameLower.includes("硫酸") || nameLower.includes("塩化") || nameLower.includes("硝酸")) {
        return "solid_crystal";
    }

    if (app.includes("powder") || app.includes("粉") || nameLower.includes("oxide") || nameLower.includes("carbonate") || nameLower.includes("bicarbonate") || nameLower.includes("酸化") || nameLower.includes("炭酸") || nameLower.includes("重曹")) {
        return "solid_powder";
    }

    if (app.includes("solid") || app.includes("固体")) {
        return "solid_powder";
    }

    return "liquid";
}
