import type { ParsedRecipe, Ingredient, StepCard, HeatLevel, StepType, IngredientCategory } from '../types/index.js';

const CHINESE_NUM_MAP: Record<string, number> = {
  '零': 0, '〇': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4,
  '五': 5, '六': 6, '七': 7, '八': 8, '九': 9,
};

function chineseToNum(str: string): number {
  if (!str) return 0;
  const s = str.trim();
  if (!s) return 0;
  if (/^\d+\.?\d*$/.test(s)) return parseFloat(s);

  if (s === '十') return 10;
  if (s === '半') return 0.5;
  if (s.startsWith('十') && s.length === 2) return 10 + (CHINESE_NUM_MAP[s[1]] || 0);
  if (s.endsWith('十') && s.length === 2) return (CHINESE_NUM_MAP[s[0]] || 0) * 10;
  if (s.includes('十') && s.length === 3 && !s.includes('百')) {
    const parts = s.split('十');
    const tens = parts[0] === '' ? 1 : CHINESE_NUM_MAP[parts[0]] || 0;
    const ones = parts[1] ? CHINESE_NUM_MAP[parts[1]] || 0 : 0;
    return tens * 10 + ones;
  }
  if (s === '百') return 100;
  if (s === '半') return 0.5;
  if (/^.*?半$/.test(s)) {
    const prefix = s.replace(/半$/, '');
    return (prefix ? chineseToNum(prefix) : 0) + 0.5;
  }

  if (/^半.*?$/.test(s)) {
    const suffix = s.replace(/^半/, '');
    return 0.5 + (suffix ? chineseToNum(suffix) : 0);
  }

  let result = 0;
  for (const ch of s) {
    const n = CHINESE_NUM_MAP[ch];
    if (n !== undefined) result = result * 10 + n;
  }
  return result;
}

function parseAnyNumber(str: string): number {
  if (!str) return 0;
  const trimmed = str.trim();
  if (!trimmed) return 0;
  if (/^\d+\.?\d*$/.test(trimmed)) return parseFloat(trimmed);
  return chineseToNum(trimmed);
}

const UNITS = [
  '公斤', '千克', '克', '斤', '两',
  '升', '毫升',
  '大勺', '小勺', '汤匙', '茶匙', '汤勺', '勺',
  '大碗', '小碗', '碗', '杯',
  '大把', '小把', '把',
  '小段', '大块', '小块', '段', '块', '片', '朵', '个', '只', '条', '根', '瓣', '粒', '颗', '节',
  '小撮', '撮', '几滴', '滴',
  '少许', '适量', '若干', '少量',
];

const UNIT_PATTERN = UNITS.join('|');

const NUM_PATTERN = `\\d+\\.?\\d*|[零〇一二两三四五六七八九十百半]+`;

const COMMON_INGREDIENTS: Array<{ names: string[]; category: IngredientCategory; defaultAmount: { amount: number; unit: string } }> = [
  { names: ['五花肉', '猪肉', '猪五花'], category: 'main', defaultAmount: { amount: 500, unit: '克' } },
  { names: ['猪肋排', '排骨', '肋排'], category: 'main', defaultAmount: { amount: 500, unit: '克' } },
  { names: ['猪里脊', '里脊肉'], category: 'main', defaultAmount: { amount: 300, unit: '克' } },
  { names: ['牛肉', '牛腩', '牛腱子'], category: 'main', defaultAmount: { amount: 500, unit: '克' } },
  { names: ['鸡肉', '鸡腿', '鸡翅', '鸡胸肉'], category: 'main', defaultAmount: { amount: 500, unit: '克' } },
  { names: ['鸡蛋'], category: 'main', defaultAmount: { amount: 3, unit: '个' } },
  { names: ['鸭蛋', '松花蛋', '皮蛋'], category: 'main', defaultAmount: { amount: 2, unit: '个' } },
  { names: ['鲈鱼', '鲫鱼', '鲤鱼', '草鱼', '黄花鱼', '带鱼'], category: 'main', defaultAmount: { amount: 1, unit: '条' } },
  { names: ['虾', '大虾', '基围虾', '虾仁'], category: 'main', defaultAmount: { amount: 300, unit: '克' } },
  { names: ['土豆', '马铃薯'], category: 'main', defaultAmount: { amount: 2, unit: '个' } },
  { names: ['番茄', '西红柿'], category: 'main', defaultAmount: { amount: 2, unit: '个' } },
  { names: ['黄瓜'], category: 'main', defaultAmount: { amount: 2, unit: '根' } },
  { names: ['茄子'], category: 'main', defaultAmount: { amount: 2, unit: '根' } },
  { names: ['青椒', '柿子椒', '菜椒'], category: 'main', defaultAmount: { amount: 2, unit: '个' } },
  { names: ['红椒'], category: 'main', defaultAmount: { amount: 1, unit: '个' } },
  { names: ['白菜', '大白菜', '娃娃菜'], category: 'main', defaultAmount: { amount: 1, unit: '颗' } },
  { names: ['青菜', '小青菜', '上海青', '油菜'], category: 'main', defaultAmount: { amount: 300, unit: '克' } },
  { names: ['菠菜'], category: 'main', defaultAmount: { amount: 300, unit: '克' } },
  { names: ['韭菜'], category: 'main', defaultAmount: { amount: 200, unit: '克' } },
  { names: ['芹菜'], category: 'main', defaultAmount: { amount: 300, unit: '克' } },
  { names: ['莲藕', '莲菜'], category: 'main', defaultAmount: { amount: 1, unit: '节' } },
  { names: ['豆角', '四季豆', '豇豆'], category: 'main', defaultAmount: { amount: 300, unit: '克' } },
  { names: ['豆腐', '嫩豆腐', '老豆腐', '北豆腐', '南豆腐'], category: 'main', defaultAmount: { amount: 1, unit: '块' } },
  { names: ['千张', '豆皮', '百叶'], category: 'main', defaultAmount: { amount: 200, unit: '克' } },
  { names: ['木耳', '黑木耳'], category: 'side', defaultAmount: { amount: 10, unit: '克' } },
  { names: ['香菇', '蘑菇', '平菇', '金针菇'], category: 'side', defaultAmount: { amount: 100, unit: '克' } },
  { names: ['海带'], category: 'side', defaultAmount: { amount: 100, unit: '克' } },
  { names: ['笋', '竹笋', '莴笋'], category: 'side', defaultAmount: { amount: 200, unit: '克' } },
  { names: ['豆芽', '黄豆芽', '绿豆芽'], category: 'side', defaultAmount: { amount: 300, unit: '克' } },
  { names: ['食盐', '盐', '精盐'], category: 'seasoning', defaultAmount: { amount: 1, unit: '小勺' } },
  { names: ['白糖', '白砂糖', '蔗糖'], category: 'seasoning', defaultAmount: { amount: 1, unit: '勺' } },
  { names: ['冰糖', '老冰糖', '黄冰糖'], category: 'seasoning', defaultAmount: { amount: 30, unit: '克' } },
  { names: ['红糖'], category: 'seasoning', defaultAmount: { amount: 1, unit: '勺' } },
  { names: ['生抽'], category: 'seasoning', defaultAmount: { amount: 2, unit: '勺' } },
  { names: ['老抽'], category: 'seasoning', defaultAmount: { amount: 1, unit: '勺' } },
  { names: ['酱油'], category: 'seasoning', defaultAmount: { amount: 2, unit: '勺' } },
  { names: ['蚝油'], category: 'seasoning', defaultAmount: { amount: 1, unit: '勺' } },
  { names: ['米醋', '白醋', '陈醋', '香醋', '醋'], category: 'seasoning', defaultAmount: { amount: 2, unit: '勺' } },
  { names: ['料酒', '黄酒'], category: 'seasoning', defaultAmount: { amount: 2, unit: '勺' } },
  { names: ['香油', '麻油', '芝麻油'], category: 'seasoning', defaultAmount: { amount: 1, unit: '勺' } },
  { names: ['食用油', '色拉油', '菜籽油', '花生油', '橄榄油'], category: 'seasoning', defaultAmount: { amount: 2, unit: '勺' } },
  { names: ['生姜', '姜', '老姜'], category: 'seasoning', defaultAmount: { amount: 3, unit: '片' } },
  { names: ['大蒜', '蒜', '蒜瓣', '蒜头'], category: 'seasoning', defaultAmount: { amount: 3, unit: '瓣' } },
  { names: ['大葱', '葱', '葱白'], category: 'seasoning', defaultAmount: { amount: 1, unit: '段' } },
  { names: ['葱花', '小葱', '香葱'], category: 'seasoning', defaultAmount: { amount: 1, unit: '小撮' } },
  { names: ['八角', '大料'], category: 'seasoning', defaultAmount: { amount: 2, unit: '个' } },
  { names: ['桂皮'], category: 'seasoning', defaultAmount: { amount: 1, unit: '小块' } },
  { names: ['花椒'], category: 'seasoning', defaultAmount: { amount: 1, unit: '小撮' } },
  { names: ['干辣椒', '辣椒', '小米辣'], category: 'seasoning', defaultAmount: { amount: 3, unit: '个' } },
  { names: ['胡椒粉', '胡椒'], category: 'seasoning', defaultAmount: { amount: 0.5, unit: '小勺' } },
  { names: ['孜然'], category: 'seasoning', defaultAmount: { amount: 1, unit: '小勺' } },
  { names: ['五香粉'], category: 'seasoning', defaultAmount: { amount: 1, unit: '小勺' } },
  { names: ['豆瓣酱', '郫县豆瓣'], category: 'seasoning', defaultAmount: { amount: 1, unit: '勺' } },
  { names: ['淀粉', '生粉', '玉米淀粉'], category: 'seasoning', defaultAmount: { amount: 1, unit: '勺' } },
  { names: ['味精'], category: 'seasoning', defaultAmount: { amount: 0.5, unit: '小勺' } },
  { names: ['鸡精'], category: 'seasoning', defaultAmount: { amount: 0.5, unit: '小勺' } },
  { names: ['白芝麻', '芝麻'], category: 'side', defaultAmount: { amount: 1, unit: '勺' } },
  { names: ['香菜'], category: 'side', defaultAmount: { amount: 1, unit: '小撮' } },
  { names: ['枸杞'], category: 'side', defaultAmount: { amount: 10, unit: '粒' } },
  { names: ['红枣', '大枣'], category: 'side', defaultAmount: { amount: 5, unit: '颗' } },
  { names: ['花生', '花生米'], category: 'side', defaultAmount: { amount: 50, unit: '克' } },
  { names: ['姜蒜', '葱姜蒜'], category: 'seasoning', defaultAmount: { amount: 1, unit: '份' } },
];

function buildIngredientNamePattern(): string {
  const allNames: string[] = [];
  for (const ing of COMMON_INGREDIENTS) {
    allNames.push(...ing.names);
  }
  return allNames
    .sort((a, b) => b.length - a.length)
    .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
}

const INGREDIENT_NAME_PATTERN = buildIngredientNamePattern();

function findIngredientMeta(name: string): { category: IngredientCategory; defaultAmount: { amount: number; unit: string } } | null {
  for (const ing of COMMON_INGREDIENTS) {
    if (ing.names.some((n) => n === name || name.includes(n))) {
      return { category: ing.category, defaultAmount: ing.defaultAmount };
    }
  }
  return null;
}

function detectHeatLevel(text: string): HeatLevel {
  if (/大火|旺火|猛火|高火/.test(text)) return 'high';
  if (/小火|微火|慢火|低火/.test(text)) return 'low';
  if (/中火|中小火|中大火/.test(text)) return 'medium';
  return 'none';
}

function detectStepType(text: string, index: number, total: number): StepType {
  if (/切|洗|摘|处理|改刀|焯水|杀|刮|去|削|剥|剔|剁|拍|切配|清洗/.test(text)) return 'wash-cut';
  if (/调|配|备|腌制|腌|准备|泡|发|拌|裹|挂|上浆|挂糊/.test(text)) return 'prep';
  if (/炒|煎|炸|炖|煮|蒸|焖|烧|烤|熬|烩|爆|煸|烫|汆|卤|酱|熏|焗|煲|煨|淋油|泼油|过油|滑油|红烧|干烧|煸炒|翻炒|炒香|爆香|炝/.test(text)) return 'cooking';
  if (/装盘|盛出|摆|撒|点缀|淋|出锅|上桌|摆盘|盛盘|摆入|码放|装饰/.test(text)) return 'plating';
  if (index === 0) return 'wash-cut';
  if (index === total - 1) return 'plating';
  return 'cooking';
}

function detectDuration(text: string): number {
  if (/一个半小时|个半小时/.test(text)) return 90;
  if (/半小时/.test(text)) return 30;

  const hourMatch = text.match(new RegExp(`(${NUM_PATTERN})\\s*(?:个)?\\s*小时`, 'i'));
  if (hourMatch) {
    const n = parseAnyNumber(hourMatch[1]);
    if (n > 0) return Math.round(n * 60);
  }

  const minuteMatch = text.match(new RegExp(`(${NUM_PATTERN})\\s*(?:分钟|分|min)`, 'i'));
  if (minuteMatch) {
    const n = parseAnyNumber(minuteMatch[1]);
    if (n > 0) return n;
  }

  const cookMatch = text.match(new RegExp(`(?:炖|煮|焖|蒸|烧|熬|煨|烤|炸)\\s*(${NUM_PATTERN})`));
  if (cookMatch) {
    const n = parseAnyNumber(cookMatch[1]);
    if (n > 0) {
      if (n < 5) return n * 60;
      return n;
    }
  }

  if (/个把小时|钟头/.test(text)) return 60;

  return 10;
}

function extractIngredients(text: string): Omit<Ingredient, 'id'>[] {
  const found = new Map<string, Omit<Ingredient, 'id'>>();

  function addIngredient(
    name: string,
    matchText: string,
    capturedAmount?: string,
    capturedUnit?: string
  ) {
    if (found.has(name)) return;
    const meta = findIngredientMeta(name);
    if (!meta) return;

    let unit = capturedUnit;
    if (!unit) {
      const unitMatch = matchText.match(new RegExp(`(${UNIT_PATTERN})`));
      unit = unitMatch ? unitMatch[1] : meta.defaultAmount.unit;
    }

    let amount = 0;
    let numStr = capturedAmount;
    if (!numStr) {
      const numMatch = matchText.match(new RegExp(`(${NUM_PATTERN})(?![零〇一二两三四五六七八九十百半]*克|斤|两|勺|个|只|条|根|块|片|颗|粒|朵|段|节|把|碗|杯|撮|滴|升|毫升)`));
      if (numMatch) {
        numStr = numMatch[1];
      } else {
        const allNums = Array.from(matchText.matchAll(new RegExp(`(${NUM_PATTERN})`, 'g')));
        for (const n of allNums) {
          const parsed = parseAnyNumber(n[1]);
          if (parsed > 0) {
            numStr = n[1];
            break;
          }
        }
      }
    }

    if (numStr) {
      amount = parseAnyNumber(numStr);
    }

    const hasHalf = /半/.test(matchText);
    if (hasHalf && amount === 0) {
      amount = 0.5;
    }

    if (amount <= 0) {
      amount = meta.defaultAmount.amount;
      unit = meta.defaultAmount.unit;
    }

    if (unit === '适量' || unit === '少许' || unit === '若干' || unit === '少量') {
      if (amount === 1 && meta.defaultAmount.amount !== 1) {
        amount = meta.defaultAmount.amount;
        unit = meta.defaultAmount.unit;
      }
    }

    found.set(name, {
      name,
      amount: Math.round(amount * 100) / 100,
      unit,
      category: meta.category,
    });
  }

  const nameFirstPattern = new RegExp(`(${INGREDIENT_NAME_PATTERN})\\s*(${NUM_PATTERN})?\\s*(${UNIT_PATTERN})?`, 'g');
  let m: RegExpExecArray | null;
  while ((m = nameFirstPattern.exec(text)) !== null) {
    addIngredient(m[1], m[0], m[2], m[3]);
  }

  const amountFirstPattern = new RegExp(`(${NUM_PATTERN})\\s*(${UNIT_PATTERN})?\\s*(${INGREDIENT_NAME_PATTERN})`, 'g');
  while ((m = amountFirstPattern.exec(text)) !== null) {
    addIngredient(m[3], m[0], m[1], m[2]);
  }

  const standalonePattern = new RegExp(`(${INGREDIENT_NAME_PATTERN})`, 'g');
  while ((m = standalonePattern.exec(text)) !== null) {
    if (!found.has(m[1])) {
      const meta = findIngredientMeta(m[1]);
      if (meta) {
        found.set(m[1], {
          name: m[1],
          amount: meta.defaultAmount.amount,
          unit: meta.defaultAmount.unit,
          category: meta.category,
        });
      }
    }
  }

  const result = Array.from(found.values());
  const mains = result.filter((r) => r.category === 'main');
  const sides = result.filter((r) => r.category === 'side');
  const seasonings = result.filter((r) => r.category === 'seasoning');

  return result.length > 0 ? [...mains, ...sides, ...seasonings] : [
    { name: '主料', amount: 500, unit: '克', category: 'main' },
    { name: '葱姜蒜', amount: 1, unit: '份', category: 'seasoning' },
    { name: '调味料', amount: 1, unit: '份', category: 'seasoning' },
  ];
}

function splitSteps(text: string): string[] {
  let steps = text
    .replace(/[。；;\n\r！!？?]/g, '。')
    .split('。')
    .map((s) => s.trim())
    .filter((s) => s.length > 3);

  if (steps.length <= 2) {
    steps = text
      .replace(/[，,、；;]/g, '，')
      .split('，')
      .map((s) => s.trim())
      .filter((s) => s.length > 3);
  }

  if (steps.length > 6) {
    const merged: string[] = [];
    let current = '';
    for (let i = 0; i < steps.length; i++) {
      current += steps[i] + '，';
      if (i % 2 === 1 || i === steps.length - 1) {
        merged.push(current.replace(/，$/, ''));
        current = '';
      }
    }
    steps = merged;
  }

  if (steps.length > 8) {
    steps = steps.slice(0, 8);
  }

  if (steps.length < 2 && text.length > 0) {
    steps = [text.substring(0, Math.floor(text.length / 2)), text.substring(Math.floor(text.length / 2))];
  }

  return steps;
}

function generateStepTitle(stepText: string, index: number): string {
  const actions = /(炒|煎|炸|炖|煮|蒸|焖|烧|烤|熬|烩|爆|煸|烫|汆|卤|酱|熏|焗|煲|煨|切|洗|摘|调|配|备|腌|泡|发|装|盛|摆|撒|淋|出|焯水|处理|腌制|剥|削|剁|拍|拌|裹|淋油|泼油|收汁|勾芡)/;
  const match = stepText.match(actions);
  if (match) {
    const action = match[1];
    return `第${index + 1}步 · ${action}制`;
  }
  return `第${index + 1}步`;
}

function detectCommonMistakes(stepText: string, stepType: StepType): string[] {
  const mistakes: string[] = [];

  if (stepType === 'cooking') {
    if (/炒|煎/.test(stepText)) {
      mistakes.push('火太大容易糊');
    }
    if (/炖|煮|焖/.test(stepText)) {
      mistakes.push('中途开盖次数多会影响口感');
    }
    if (/蒸/.test(stepText)) {
      mistakes.push('蒸时间长了会老');
    }
    if (/糖|上色/.test(stepText)) {
      mistakes.push('注意糖色别炒糊了');
    }
  }

  if (stepType === 'wash-cut') {
    if (/肉/.test(stepText)) {
      mistakes.push('切太小块没口感');
    }
    if (/焯水/.test(stepText)) {
      mistakes.push('要冷水下锅');
    }
    if (/鱼/.test(stepText)) {
      mistakes.push('鱼肚子里的黑膜要刮干净');
    }
  }

  if (stepType === 'prep') {
    mistakes.push('调料比例根据个人口味调整');
  }

  if (mistakes.length === 0) {
    mistakes.push('注意火候');
  }

  return mistakes.slice(0, 2);
}

function detectTips(stepText: string): string {
  if (/糖|糖色/.test(stepText)) return '小火慢炒别着急，看到冒细密小泡就差不多了';
  if (/蛋/.test(stepText)) return '油温高点鸡蛋才蓬松，加半勺水更嫩';
  if (/鱼/.test(stepText)) return '新鲜的鱼才好吃，处理干净去腥';
  if (/肉/.test(stepText)) return '顺着纹理切更嫩，腌制时抓匀上浆';
  if (/炒/.test(stepText)) return '锅热倒油，滑炒更嫩';
  if (/炖|煮|焖/.test(stepText)) return '小火慢炖才入味，一次性加足水';
  if (/凉拌|拌/.test(stepText)) return '放冰箱冰一下口感更好';
  return '凭经验判断就好';
}

export function parseRecipeText(text: string, name?: string): ParsedRecipe {
  const cleanText = text.trim();

  const ingredients = extractIngredients(cleanText);
  const stepTexts = splitSteps(cleanText);

  const steps: Omit<StepCard, 'id' | 'recipeId'>[] = stepTexts.map((stepText, index) => {
    const type = detectStepType(stepText, index, stepTexts.length);
    return {
      order: index + 1,
      title: generateStepTitle(stepText, index),
      description: stepText,
      duration: detectDuration(stepText),
      heatLevel: detectHeatLevel(stepText),
      type,
      commonMistakes: detectCommonMistakes(stepText, type),
      tips: detectTips(stepText),
      ingredientIds: [],
    };
  });

  return {
    name: name || '新菜谱',
    ingredients,
    steps,
  };
}
