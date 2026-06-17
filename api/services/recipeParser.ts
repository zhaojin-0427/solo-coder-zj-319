import type { ParsedRecipe, Ingredient, StepCard, HeatLevel, StepType } from '../types/index.js';

function generateId(prefix: string, index: number): string {
  return `${prefix}_${Date.now()}_${index}`;
}

function detectHeatLevel(text: string): HeatLevel {
  if (/大火|旺火|猛火|高火/.test(text)) return 'high';
  if (/小火|微火|慢火|低火/.test(text)) return 'low';
  if (/中火|中小火|中大火/.test(text)) return 'medium';
  return 'none';
}

function detectStepType(text: string, index: number, total: number): StepType {
  if (/切|洗|摘|处理|改刀|焯水|杀|刮/.test(text)) return 'wash-cut';
  if (/调|配|备|腌制|腌|准备|泡|发/.test(text)) return 'prep';
  if (/炒|煎|炸|炖|煮|蒸|焖|烧|烤|熬|烩|爆|煸|烫|汆|卤|酱|熏|焗|煲|煨|淋油|泼油/.test(text)) return 'cooking';
  if (/装盘|盛出|摆|撒|点缀|淋|出锅|上桌|摆盘/.test(text)) return 'plating';
  if (index === 0) return 'wash-cut';
  if (index === total - 1) return 'plating';
  return 'cooking';
}

function detectDuration(text: string): number {
  const match = text.match(/(\d+)\s*(分钟|分|min|小时|钟头|h)/i);
  if (match) {
    const num = parseInt(match[1]);
    if (/小时|钟头|h/i.test(match[2])) {
      return num * 60;
    }
    return num;
  }
  return 10;
}

function extractIngredients(text: string): Omit<Ingredient, 'id'>[] {
  const ingredients: Omit<Ingredient, 'id'>[] = [];
  
  const patterns = [
    /([\u4e00-\u9fa5]{2,4})(?:\s*)(\d+\.?\d*)(\s*克|公斤|斤|两|毫升|升|个|只|条|块|片|朵|把|勺|茶匙|汤匙|碗|杯|小撮|小段|少许|适量|若干)/g,
  ];
  
  const commonIngredients = [
    { name: '食盐', category: 'seasoning' as const },
    { name: '白糖', category: 'seasoning' as const },
    { name: '冰糖', category: 'seasoning' as const },
    { name: '生抽', category: 'seasoning' as const },
    { name: '老抽', category: 'seasoning' as const },
    { name: '料酒', category: 'seasoning' as const },
    { name: '米醋', category: 'seasoning' as const },
    { name: '陈醋', category: 'seasoning' as const },
    { name: '香油', category: 'seasoning' as const },
    { name: '食用油', category: 'seasoning' as const },
    { name: '生姜', category: 'seasoning' as const },
    { name: '大蒜', category: 'seasoning' as const },
    { name: '大葱', category: 'seasoning' as const },
    { name: '葱花', category: 'seasoning' as const },
    { name: '八角', category: 'seasoning' as const },
    { name: '桂皮', category: 'seasoning' as const },
    { name: '花椒', category: 'seasoning' as const },
    { name: '干辣椒', category: 'seasoning' as const },
    { name: '五花肉', category: 'main' as const },
    { name: '猪肋排', category: 'main' as const },
    { name: '鸡蛋', category: 'main' as const },
    { name: '番茄', category: 'main' as const },
    { name: '西红柿', category: 'main' as const },
    { name: '黄瓜', category: 'main' as const },
    { name: '鲈鱼', category: 'main' as const },
    { name: '土豆', category: 'main' as const },
    { name: '青椒', category: 'side' as const },
    { name: '红椒', category: 'side' as const },
    { name: '香菜', category: 'side' as const },
    { name: '白芝麻', category: 'side' as const },
  ];
  
  const foundIngredients = new Set<string>();
  
  for (const ing of commonIngredients) {
    const regex = new RegExp(ing.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    if (regex.test(text)) {
      foundIngredients.add(ing.name);
      ingredients.push({
        name: ing.name,
        amount: 1,
        unit: '适量',
        category: ing.category,
      });
    }
  }
  
  if (ingredients.length === 0) {
    ingredients.push(
      { name: '主料', amount: 500, unit: '克', category: 'main' },
      { name: '葱姜蒜', amount: 1, unit: '份', category: 'seasoning' },
      { name: '调味料', amount: 1, unit: '份', category: 'seasoning' },
    );
  }
  
  return ingredients;
}

function splitSteps(text: string): string[] {
  let steps = text
    .replace(/[。；\n]/g, '。')
    .split('。')
    .map(s => s.trim())
    .filter(s => s.length > 3);
  
  if (steps.length <= 2) {
    steps = text
      .replace(/[，,、；;]/g, '，')
      .split('，')
      .map(s => s.trim())
      .filter(s => s.length > 3);
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
  const actions = /(炒|煎|炸|炖|煮|蒸|焖|烧|烤|熬|烩|爆|煸|烫|汆|卤|酱|熏|焗|煲|煨|切|洗|摘|调|配|备|腌|泡|发|装|盛|摆|撒|淋|出)/;
  const match = stepText.match(actions);
  if (match) {
    const action = match[1];
    if (stepText.length > 10) {
      return `第${index + 1}步 · ${action}制`;
    }
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
  }
  
  if (stepType === 'wash-cut') {
    if (/肉/.test(stepText)) {
      mistakes.push('切太小块没口感');
    }
    if (/焯水/.test(stepText)) {
      mistakes.push('要冷水下锅');
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
  if (/糖|糖色/.test(stepText)) return '小火慢炒别着急';
  if (/蛋/.test(stepText)) return '油温高点更蓬松';
  if (/鱼/.test(stepText)) return '新鲜的鱼才好吃';
  if (/肉/.test(stepText)) return '顺着纹理切更嫩';
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
