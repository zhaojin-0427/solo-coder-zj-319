import type {
  Leftover,
  Recipe,
  Member,
  SecondCookingSuggestion,
  SecondCookingIngredient,
  SecondCookingStep,
  AllergenType,
} from '../types/index.js';

const SECOND_COOKING_TEMPLATES: Record<
  string,
  Array<{
    name: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedTime: number;
    servings: number;
    ingredients: Array<{ name: string; amount: number; unit: string }>;
    steps: Array<{ order: number; title: string; description: string; duration: number; tips?: string }>;
    ingredientTriggers: string[];
  }>
> = {
  '肉类': [
    {
      name: '红烧肉焖面',
      description: '将剩余红烧肉与面条同焖，让面条充分吸收肉汁，香而不腻',
      difficulty: 'easy',
      estimatedTime: 20,
      servings: 2,
      ingredients: [
        { name: '面条', amount: 200, unit: '克' },
        { name: '青菜', amount: 100, unit: '克' },
      ],
      steps: [
        { order: 1, title: '加热红烧肉', description: '剩红烧肉倒入锅中，加少许水加热至肉汁融化', duration: 5 },
        { order: 2, title: '煮面', description: '另起一锅水烧开，下面条煮至八成熟捞出', duration: 6, tips: '面条不要煮太烂' },
        { order: 3, title: '焖制入味', description: '将面条倒入红烧肉锅中小火焖3分钟，加青菜翻匀出锅', duration: 8 },
      ],
      ingredientTriggers: ['五花肉', '猪肉', '红烧', '肉'],
    },
    {
      name: '排骨汤面',
      description: '用剩余排骨汤做汤底，煮一碗浓香骨汤面',
      difficulty: 'easy',
      estimatedTime: 15,
      servings: 2,
      ingredients: [
        { name: '面条', amount: 200, unit: '克' },
        { name: '葱花', amount: 1, unit: '小撮' },
      ],
      steps: [
        { order: 1, title: '加热汤底', description: '剩排骨和汤倒入锅中，加水稀释烧开', duration: 5 },
        { order: 2, title: '下', description: '直接在汤中下面条煮熟', duration: 6, tips: '根据汤的咸淡决定是否加盐' },
        { order: 3, title: '调味出锅', description: '撒葱花，滴几滴香油即可出锅', duration: 2 },
      ],
      ingredientTriggers: ['排骨', '猪肋排', '骨头', '汤'],
    },
    {
      name: '肉糜炒饭',
      description: '把剩余肉类拆碎炒散，与米饭同炒，粒粒分明肉香四溢',
      difficulty: 'easy',
      estimatedTime: 15,
      servings: 2,
      ingredients: [
        { name: '剩米饭', amount: 400, unit: '克' },
        { name: '鸡蛋', amount: 2, unit: '个' },
        { name: '葱花', amount: 1, unit: '小撮' },
      ],
      steps: [
        { order: 1, title: '拆肉', description: '将剩余肉类去骨拆碎，撕成小块或剁成肉糜', duration: 5 },
        { order: 2, title: '炒蛋', description: '鸡蛋打散，锅热油炒蛋盛出备用', duration: 3 },
        { order: 3, title: '炒饭', description: '米饭下锅炒散，加肉糜和鸡蛋翻炒均匀，撒葱花出锅', duration: 6, tips: '用隔夜饭效果最好' },
      ],
      ingredientTriggers: ['肉', '排骨', '五花', '鸡', '牛', '鱼'],
    },
    {
      name: '回锅肉片',
      description: '剩余肉片加大蒜、青椒回锅炒制，又是一道下饭硬菜',
      difficulty: 'medium',
      estimatedTime: 20,
      servings: 2,
      ingredients: [
        { name: '青椒', amount: 2, unit: '个' },
        { name: '大蒜', amount: 3, unit: '瓣' },
        { name: '郫县豆瓣', amount: 1, unit: '勺' },
      ],
      steps: [
        { order: 1, title: '切配', description: '肉片切片，青椒切块，大蒜切片', duration: 5 },
        { order: 2, title: '炒香底料', description: '锅少油，下肉片煸炒出油，加豆瓣酱炒出红油', duration: 8 },
        { order: 3, title: '混炒出锅', description: '下青椒蒜片快速翻炒断生即可出锅', duration: 5, tips: '肉片本身有咸味，注意少放盐' },
      ],
      ingredientTriggers: ['肉', '五花', '猪肉', '牛肉'],
    },
  ],
  '主食': [
    {
      name: '创意炒饭',
      description: '剩米饭加鸡蛋蔬菜，炒一碗金黄喷香的蛋炒饭',
      difficulty: 'easy',
      estimatedTime: 15,
      servings: 2,
      ingredients: [
        { name: '鸡蛋', amount: 2, unit: '个' },
        { name: '葱花', amount: 1, unit: '小撮' },
        { name: '火腿丁', amount: 50, unit: '克' },
      ],
      steps: [
        { order: 1, title: '打散米饭', description: '剩米饭用手或勺轻轻打散，不要结块', duration: 3 },
        { order: 2, title: '炒蛋', description: '鸡蛋打散下锅炒至半凝固', duration: 3 },
        { order: 3, title: '炒饭出锅', description: '下米饭和火腿丁大火翻炒均匀，撒葱花出锅', duration: 8, tips: '火要大，翻炒要快' },
      ],
      ingredientTriggers: ['米饭', '米', '饭'],
    },
    {
      name: '米饼',
      description: '把剩米饭压成饼，煎至两面金黄，外酥里软',
      difficulty: 'easy',
      estimatedTime: 15,
      servings: 2,
      ingredients: [
        { name: '鸡蛋', amount: 1, unit: '个' },
        { name: '面粉', amount: 30, unit: '克' },
      ],
      steps: [
        { order: 1, title: '拌料', description: '米饭加鸡蛋、面粉、少许盐拌匀', duration: 5 },
        { order: 2, title: '煎饼', description: '锅中倒油，米饭团成饼状下锅，中小火慢煎', duration: 8, tips: '不要急于翻面，煎定型再翻' },
        { order: 3, title: '出锅', description: '两面金黄后盛出，可配番茄酱食用', duration: 2 },
      ],
      ingredientTriggers: ['米饭', '米', '饭'],
    },
    {
      name: '泡饭粥',
      description: '剩米饭加水煮成软绵的粥，配小菜最养胃',
      difficulty: 'easy',
      estimatedTime: 15,
      servings: 2,
      ingredients: [
        { name: '清水', amount: 1000, unit: '毫升' },
        { name: '姜丝', amount: 3, unit: '片' },
      ],
      steps: [
        { order: 1, title: '煮泡饭', description: '米饭加水和姜丝，大火煮开转小火', duration: 10, tips: '喜欢稀的多加水，喜欢稠的少加水' },
        { order: 2, title: '调味出锅', description: '煮至米粒软糯，加少许盐调味即可', duration: 3 },
      ],
      ingredientTriggers: ['米饭', '米', '饭'],
    },
  ],
  '蔬菜': [
    {
      name: '蔬菜浓汤',
      description: '把剩蔬菜加汤底打成浓汤，营养又暖胃',
      difficulty: 'easy',
      estimatedTime: 20,
      servings: 2,
      ingredients: [
        { name: '清水或高汤', amount: 500, unit: '毫升' },
        { name: '淡奶油', amount: 50, unit: '毫升' },
      ],
      steps: [
        { order: 1, title: '加热蔬菜', description: '剩余蔬菜倒入锅中，加汤底煮开', duration: 8 },
        { order: 2, title: '打碎', description: '稍放凉后倒入料理机打成细腻糊状', duration: 5 },
        { order: 3, title: '调味出锅', description: '回锅加淡奶油煮开，加盐胡椒调味', duration: 5 },
      ],
      ingredientTriggers: ['黄瓜', '番茄', '青菜', '蔬菜', '白菜', '萝卜', '土豆'],
    },
    {
      name: '蔬菜炒饭',
      description: '把剩蔬菜切碎炒进饭里，让小朋友不知不觉吃蔬菜',
      difficulty: 'easy',
      estimatedTime: 15,
      servings: 2,
      ingredients: [
        { name: '剩米饭', amount: 300, unit: '克' },
        { name: '鸡蛋', amount: 1, unit: '个' },
      ],
      steps: [
        { order: 1, title: '切菜', description: '将剩余蔬菜切碎丁', duration: 4 },
        { order: 2, title: '炒香', description: '鸡蛋炒散，下蔬菜丁炒至断生', duration: 5 },
        { order: 3, title: '炒饭出锅', description: '下米饭翻炒均匀，加盐调味出锅', duration: 5 },
      ],
      ingredientTriggers: ['黄瓜', '番茄', '青菜', '蔬菜', '白菜', '萝卜'],
    },
  ],
  '海鲜': [
    {
      name: '鱼肉粥',
      description: '把剩余鱼肉剔下煮进粥里，鲜美嫩滑',
      difficulty: 'medium',
      estimatedTime: 30,
      servings: 2,
      ingredients: [
        { name: '剩米饭', amount: 200, unit: '克' },
        { name: '清水', amount: 1000, unit: '毫升' },
        { name: '姜丝', amount: 5, unit: '克' },
        { name: '葱花', amount: 1, unit: '小撮' },
      ],
      steps: [
        { order: 1, title: '剔鱼肉', description: '仔细将鱼肉剔下，挑干净鱼刺，撕成小块', duration: 8, tips: '一定要仔细挑刺' },
        { order: 2, title: '煮粥', description: '米饭加水姜丝煮成稀粥', duration: 15 },
        { order: 3, title: '下鱼出锅', description: '粥开后下鱼肉煮3分钟，撒葱花淋香油出锅', duration: 5 },
      ],
      ingredientTriggers: ['鱼', '鲈鱼', '海鲜'],
    },
    {
      name: '海鲜炒蛋',
      description: '把剩余海鲜肉与鸡蛋同炒，鲜嫩爽滑',
      difficulty: 'easy',
      estimatedTime: 15,
      servings: 2,
      ingredients: [
        { name: '鸡蛋', amount: 3, unit: '个' },
        { name: '葱花', amount: 1, unit: '小撮' },
      ],
      steps: [
        { order: 1, title: '处理海鲜', description: '剩余海鲜肉切小块，锅稍加热备用', duration: 3 },
        { order: 2, title: '混合蛋液', description: '海鲜肉放入打散的蛋液中，加少许盐', duration: 2 },
        { order: 3, title: '炒蛋出锅', description: '锅热油，下蛋液快速翻炒至刚凝固，撒葱花出锅', duration: 8, tips: '不要炒太老' },
      ],
      ingredientTriggers: ['鱼', '虾', '海鲜', '蟹', '贝'],
    },
  ],
  '通用': [
    {
      name: '万能杂烩',
      description: '多种剩菜一锅烩，加粉条或白菜炖煮，家常暖心',
      difficulty: 'easy',
      estimatedTime: 25,
      servings: 3,
      ingredients: [
        { name: '白菜', amount: 200, unit: '克' },
        { name: '粉丝或粉条', amount: 100, unit: '克' },
      ],
      steps: [
        { order: 1, title: '准备食材', description: '所有剩菜切适当大小，粉丝提前泡软', duration: 8 },
        { order: 2, title: '烩制', description: '锅少水烧开，先下耐煮的肉类，再下蔬菜和粉丝', duration: 12 },
        { order: 3, title: '调味出锅', description: '尝咸淡后适量调味，大火收汁即可', duration: 3, tips: '剩菜本身有咸味，少放盐' },
      ],
      ingredientTriggers: [],
    },
  ],
};

function getLeftoverCategory(keyIngredients: string[], recipeName: string): string {
  const allText = [...keyIngredients, recipeName].join('');
  if (/鱼|虾|蟹|贝|海鲜|鲈/.test(allText)) return '海鲜';
  if (/肉|排骨|五花|猪|牛|鸡/.test(allText)) return '肉类';
  if (/米|饭/.test(allText)) return '主食';
  if (/瓜|茄|菜|白菜|萝|土豆|番|黄/.test(allText)) return '蔬菜';
  return '通用';
}

function checkAllergenSafety(
  leftover: Leftover,
  templateIngredients: string[],
  members: Member[]
): { safe: boolean; unsafeAllergens: AllergenType[] } {
  const leftoverAllergens = leftover.containsAllergens || [];
  const unsafeAllergens: AllergenType[] = [];

  for (const member of members) {
    if (!member.profile?.allergens) continue;
    for (const allergen of member.profile.allergens) {
      if (leftoverAllergens.includes(allergen.type) && !unsafeAllergens.includes(allergen.type)) {
        unsafeAllergens.push(allergen.type);
      }
    }
  }

  return {
    safe: unsafeAllergens.length === 0,
    unsafeAllergens,
  };
}

function checkAvoidedIngredientSafety(
  leftover: Leftover,
  templateIngredients: string[],
  members: Member[]
): { safe: boolean; unsafeIngredients: string[] } {
  const leftoverAvoided = leftover.containsAvoidedIngredients || [];
  const unsafeIngredients: string[] = [];

  for (const member of members) {
    if (!member.profile?.avoidedIngredients) continue;
    for (const avoided of member.profile.avoidedIngredients) {
      if (leftoverAvoided.includes(avoided) && !unsafeIngredients.includes(avoided)) {
        unsafeIngredients.push(avoided);
      }
      for (const ing of [...templateIngredients, ...leftover.keyIngredients]) {
        if (ing.includes(avoided) && !unsafeIngredients.includes(avoided)) {
          unsafeIngredients.push(avoided);
        }
      }
    }
  }

  return {
    safe: unsafeIngredients.length === 0,
    unsafeIngredients,
  };
}

function calculateMatchScore(
  leftover: Leftover,
  template: { ingredientTriggers: string[]; difficulty: 'easy' | 'medium' | 'hard' },
  members: Member[],
  allergenSafe: boolean,
  avoidedSafe: boolean
): number {
  let score = 50;

  const triggerHits = template.ingredientTriggers.filter((trigger) => {
    const allText = [...leftover.keyIngredients, leftover.recipeName].join('');
    return allText.includes(trigger);
  }).length;
  score += triggerHits * 10;

  if (allergenSafe) score += 20;
  if (avoidedSafe) score += 15;

  if (template.difficulty === 'easy') score += 10;
  if (template.difficulty === 'medium') score += 5;

  let tasteHits = 0;
  for (const member of members) {
    if (!member.profile?.favoriteIngredients) continue;
    for (const fav of member.profile.favoriteIngredients) {
      if (leftover.keyIngredients.some((ing) => ing.includes(fav))) {
        tasteHits += 1;
      }
    }
  }
  score += tasteHits * 3;

  return Math.min(100, Math.max(0, score));
}

function getMatchedTastePreferences(leftover: Leftover, members: Member[]): string[] {
  const matched: string[] = [];
  for (const member of members) {
    if (!member.profile?.favoriteIngredients) continue;
    for (const fav of member.profile.favoriteIngredients) {
      if (leftover.keyIngredients.some((ing) => ing.includes(fav)) && !matched.includes(fav)) {
        matched.push(fav);
      }
    }
  }
  return matched;
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function generateSecondCookingSuggestions(
  leftover: Leftover,
  recipe: Recipe | undefined,
  members: Member[] = []
): SecondCookingSuggestion[] {
  if (leftover.status !== 'stored') {
    return [];
  }

  const category = getLeftoverCategory(leftover.keyIngredients, leftover.recipeName);
  const templates = [
    ...(SECOND_COOKING_TEMPLATES[category] || []),
    ...SECOND_COOKING_TEMPLATES['通用'],
  ];

  const suggestions: SecondCookingSuggestion[] = [];

  for (const template of templates) {
    const templateIngredientNames = template.ingredients.map((i) => i.name);

    const { safe: allergenSafe, unsafeAllergens } = checkAllergenSafety(
      leftover,
      templateIngredientNames,
      members
    );

    const { safe: avoidedSafe, unsafeIngredients } = checkAvoidedIngredientSafety(
      leftover,
      templateIngredientNames,
      members
    );

    if (!allergenSafe) {
      continue;
    }

    const matchScore = calculateMatchScore(
      leftover,
      template,
      members,
      allergenSafe,
      avoidedSafe
    );

    const matchedPrefs = getMatchedTastePreferences(leftover, members);

    const ingredients: SecondCookingIngredient[] = [
      {
        name: leftover.recipeName,
        amount: leftover.remainingAmount,
        unit: leftover.remainingUnit,
        isLeftover: true,
        leftoverId: leftover.id,
      },
      ...template.ingredients.map((i) => ({
        ...i,
        isLeftover: false,
      })),
    ];

    const steps: SecondCookingStep[] = template.steps;

    const suggestion: SecondCookingSuggestion = {
      id: generateId('sc'),
      leftoverId: leftover.id,
      feastId: leftover.feastId,
      name: template.name,
      description: template.description,
      difficulty: template.difficulty,
      estimatedTime: template.estimatedTime,
      servings: template.servings,
      ingredients,
      steps,
      matchScore,
      avoidsAllergens: allergenSafe,
      avoidsAvoidedIngredients: avoidedSafe,
      matchedTastePreferences: matchedPrefs,
      createdAt: new Date().toISOString(),
    };

    suggestions.push(suggestion);
  }

  suggestions.sort((a, b) => b.matchScore - a.matchScore);

  return suggestions.slice(0, 5);
}
