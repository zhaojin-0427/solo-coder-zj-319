import type {
  Member,
  Recipe,
  RecipeRiskTags,
  RecipeMemberRisk,
  RecipeCompatibilityScore,
  FeastCompatibilityResult,
  TasteLevel,
  RiskSeverity,
} from '../types/index.js';

const ALLERGEN_LABELS: Record<string, string> = {
  peanut: '花生',
  'tree-nut': '坚果',
  milk: '乳制品',
  egg: '鸡蛋',
  wheat: '小麦/麸质',
  soy: '大豆',
  fish: '鱼类',
  shellfish: '贝类/海鲜',
  sesame: '芝麻',
  other: '其他',
};

const TASTE_LABELS: Record<string, string> = {
  spicy: '辛辣',
  sweet: '甜度',
  salty: '咸度',
  sour: '酸度',
  greasy: '油脂',
};

const TASTE_LEVEL_SCORE: Record<TasteLevel, number> = {
  none: 0,
  mild: 1,
  medium: 2,
  strong: 3,
};

function generateRiskId(): string {
  return `risk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getSeverityByLevel(diff: number): RiskSeverity {
  if (diff >= 3) return 'danger';
  if (diff >= 2) return 'warning';
  return 'info';
}

function checkAllergenRisks(
  recipe: Recipe,
  member: Member,
  riskTags: RecipeRiskTags
): RecipeMemberRisk[] {
  const risks: RecipeMemberRisk[] = [];
  const profile = member.profile;
  if (!profile || profile.allergens.length === 0) return risks;

  for (const allergen of profile.allergens) {
    const containsAllergen = riskTags.containsAllergens.includes(allergen.type);
    const ingredientMatch = riskTags.keyIngredients.some(
      (ing) => ing.includes(allergen.name) || allergen.name.includes(ing)
    );

    if (containsAllergen || ingredientMatch) {
      const severity: RiskSeverity =
        allergen.severity === 'critical'
          ? 'danger'
          : allergen.severity === 'high'
          ? 'danger'
          : allergen.severity === 'medium'
          ? 'warning'
          : 'info';

      risks.push({
        riskId: generateRiskId(),
        memberId: member.id,
        memberName: member.name,
        recipeId: recipe.id,
        recipeName: recipe.name,
        type: 'allergen',
        severity,
        category: '过敏源',
        description: `${member.name}对${ALLERGEN_LABELS[allergen.type] || allergen.name}过敏，「${recipe.name}」含有相关成分`,
        suggestions: [
          `考虑替换为不含${ALLERGEN_LABELS[allergen.type] || allergen.name}的菜品`,
          `单独为${member.name}准备一份`,
          '烹饪时严格分开厨具，避免交叉污染',
        ],
        affectedIngredients: riskTags.keyIngredients.filter(
          (ing) => ing.includes(allergen.name) || allergen.name.includes(ing)
        ),
      });
    }
  }

  return risks;
}

function checkAvoidedIngredients(
  recipe: Recipe,
  member: Member,
  riskTags: RecipeRiskTags
): RecipeMemberRisk[] {
  const risks: RecipeMemberRisk[] = [];
  const profile = member.profile;
  if (!profile || profile.avoidedIngredients.length === 0) return risks;

  for (const avoided of profile.avoidedIngredients) {
    const matched = riskTags.keyIngredients.some(
      (ing) => ing.includes(avoided) || avoided.includes(ing)
    );
    if (matched) {
      const replaceable = riskTags.replaceableIngredients.find(
        (r) => r.original.includes(avoided) || avoided.includes(r.original)
      );

      const suggestions = replaceable
        ? [
            `可将「${replaceable.original}」替换为：${replaceable.alternatives.join('、')}`,
            `烹饪时单独处理，不加入${avoided}`,
            '与成员确认是否可以接受少量',
          ]
        : [
            `考虑更换不含${avoided}的菜品`,
            `烹饪时单独处理，不加入${avoided}`,
          ];

      risks.push({
        riskId: generateRiskId(),
        memberId: member.id,
        memberName: member.name,
        recipeId: recipe.id,
        recipeName: recipe.name,
        type: 'avoided-ingredient',
        severity: 'warning',
        category: '忌口食材',
        description: `${member.name}不吃${avoided}，「${recipe.name}」含有该食材`,
        suggestions,
        affectedIngredients: riskTags.keyIngredients.filter(
          (ing) => ing.includes(avoided) || avoided.includes(ing)
        ),
      });
    }
  }

  return risks;
}

function checkTasteMismatch(
  recipe: Recipe,
  member: Member,
  riskTags: RecipeRiskTags
): RecipeMemberRisk[] {
  const risks: RecipeMemberRisk[] = [];
  const profile = member.profile;
  if (!profile) return risks;

  const pref = profile.tastePreference;
  const checks: Array<{ prefLevel: TasteLevel; recipeLevel: TasteLevel; tasteKey: string }> = [
    { prefLevel: pref.spicy, recipeLevel: riskTags.spicyLevel, tasteKey: 'spicy' },
    { prefLevel: pref.sweet, recipeLevel: riskTags.sweetLevel, tasteKey: 'sweet' },
    { prefLevel: pref.salty, recipeLevel: riskTags.saltyLevel, tasteKey: 'salty' },
    { prefLevel: pref.greasy, recipeLevel: riskTags.greasyLevel, tasteKey: 'greasy' },
  ];

  for (const check of checks) {
    const diff = TASTE_LEVEL_SCORE[check.recipeLevel] - TASTE_LEVEL_SCORE[check.prefLevel];
    if (diff >= 2) {
      const severity = getSeverityByLevel(diff);
      const tasteLabel = TASTE_LABELS[check.tasteKey];
      risks.push({
        riskId: generateRiskId(),
        memberId: member.id,
        memberName: member.name,
        recipeId: recipe.id,
        recipeName: recipe.name,
        type: 'taste-mismatch',
        severity,
        category: '口味偏好',
        description: `${member.name}偏好${check.prefLevel === 'none' ? '无' : check.prefLevel === 'mild' ? '清淡' : check.prefLevel === 'medium' ? '适中' : '较重'}${tasteLabel}，「${recipe.name}」${tasteLabel}较重`,
        suggestions: [
          `减少${tasteLabel}相关调料用量`,
          `出锅前先盛出${member.name}的份量再加重调味`,
          '准备额外的清水/清汤调节',
        ],
      });
    }
  }

  return risks;
}

function checkHealthConflicts(
  recipe: Recipe,
  member: Member,
  riskTags: RecipeRiskTags
): RecipeMemberRisk[] {
  const risks: RecipeMemberRisk[] = [];
  const profile = member.profile;
  if (!profile) return risks;

  const hr = profile.healthRequirements;

  if (hr.lowSalt && riskTags.highSalt) {
    risks.push({
      riskId: generateRiskId(),
      memberId: member.id,
      memberName: member.name,
      recipeId: recipe.id,
      recipeName: recipe.name,
      type: 'health-conflict',
      severity: 'warning',
      category: '低盐要求',
      description: `${member.name}需要低盐饮食，「${recipe.name}」含盐量较高`,
      suggestions: [
        '减少酱油、盐等咸味调料',
        '用天然香料替代部分盐',
        '出锅前先盛出低盐份量',
      ],
    });
  }

  if (hr.lowOil && riskTags.highOil) {
    risks.push({
      riskId: generateRiskId(),
      memberId: member.id,
      memberName: member.name,
      recipeId: recipe.id,
      recipeName: recipe.name,
      type: 'health-conflict',
      severity: 'warning',
      category: '低油要求',
      description: `${member.name}需要低油饮食，「${recipe.name}」用油量较高`,
      suggestions: [
        '减少烹饪用油',
        '改用蒸、煮、烤等低油烹饪方式',
        '使用喷油壶控制油量',
      ],
    });
  }

  if (hr.lowSugar && riskTags.highSugar) {
    risks.push({
      riskId: generateRiskId(),
      memberId: member.id,
      memberName: member.name,
      recipeId: recipe.id,
      recipeName: recipe.name,
      type: 'health-conflict',
      severity: 'warning',
      category: '低糖要求',
      description: `${member.name}需要低糖饮食，「${recipe.name}」含糖量较高`,
      suggestions: [
        '减少糖的用量或使用代糖',
        '选择本身甜度较低的食材',
        '避免额外添加糖调味',
      ],
    });
  }

  if (hr.vegetarian && riskTags.containsMeat) {
    risks.push({
      riskId: generateRiskId(),
      memberId: member.id,
      memberName: member.name,
      recipeId: recipe.id,
      recipeName: recipe.name,
      type: 'health-conflict',
      severity: 'danger',
      category: '素食要求',
      description: `${member.name}是素食者，「${recipe.name}」含有肉类`,
      suggestions: [
        '将肉类替换为豆腐、菌菇等素食食材',
        '准备单独的素食菜品',
        '确认是否可以接受蛋奶素',
      ],
    });
  }

  if (hr.glutenFree && riskTags.containsGluten) {
    risks.push({
      riskId: generateRiskId(),
      memberId: member.id,
      memberName: member.name,
      recipeId: recipe.id,
      recipeName: recipe.name,
      type: 'health-conflict',
      severity: 'warning',
      category: '无麸质要求',
      description: `${member.name}需要无麸质饮食，「${recipe.name}」可能含有麸质`,
      suggestions: [
        '更换为无麸质酱油等调料',
        '避免使用小麦制品',
        '确认所有食材不含麸质',
      ],
    });
  }

  return risks;
}

function getDefaultRiskTags(): RecipeRiskTags {
  return {
    spicyLevel: 'none',
    sweetLevel: 'none',
    saltyLevel: 'none',
    greasyLevel: 'none',
    containsAllergens: [],
    highSalt: false,
    highOil: false,
    highSugar: false,
    containsMeat: false,
    containsGluten: false,
    keyIngredients: [],
    replaceableIngredients: [],
  };
}

export function computeRecipeMemberRisks(
  recipe: Recipe,
  members: Member[]
): RecipeMemberRisk[] {
  const riskTags = recipe.riskTags || getDefaultRiskTags();
  if (!recipe.riskTags) {
    riskTags.keyIngredients = recipe.ingredients.map((i) => i.name);
  }

  const allRisks: RecipeMemberRisk[] = [];

  for (const member of members) {
    if (!member.profile) continue;

    allRisks.push(...checkAllergenRisks(recipe, member, riskTags));
    allRisks.push(...checkAvoidedIngredients(recipe, member, riskTags));
    allRisks.push(...checkTasteMismatch(recipe, member, riskTags));
    allRisks.push(...checkHealthConflicts(recipe, member, riskTags));
  }

  return allRisks;
}

export function computeRecipeCompatibility(
  recipe: Recipe,
  members: Member[]
): RecipeCompatibilityScore {
  const risks = computeRecipeMemberRisks(recipe, members);
  const memberCount = members.filter((m) => m.profile).length;
  const membersWithRisks = new Set(risks.map((r) => r.memberId));
  const satisfiedMembers = Math.max(0, memberCount - membersWithRisks.size);
  const criticalRiskCount = risks.filter((r) => r.severity === 'danger').length;
  const warningRiskCount = risks.filter((r) => r.severity === 'warning').length;

  const riskPenalty = risks.reduce((sum, r) => {
    if (r.severity === 'danger') return sum + 25;
    if (r.severity === 'warning') return sum + 10;
    return sum + 3;
  }, 0);

  const totalScore = Math.max(0, 100 - riskPenalty);
  const satisfiedPercentage =
    memberCount > 0 ? Math.round((satisfiedMembers / memberCount) * 100) : 100;

  return {
    recipeId: recipe.id,
    recipeName: recipe.name,
    totalScore,
    satisfiedMembers,
    totalMembers: memberCount,
    satisfiedPercentage,
    riskCount: risks.length,
    criticalRiskCount,
    warningRiskCount,
    risks,
  };
}

export function computeFeastCompatibility(
  feastId: string,
  recipes: Recipe[],
  members: Member[]
): FeastCompatibilityResult {
  const recipeScores = recipes.map((r) => computeRecipeCompatibility(r, members));
  const allRisks = recipeScores.flatMap((s) => s.risks);
  const totalRiskCount = allRisks.length;
  const criticalRiskCount = allRisks.filter((r) => r.severity === 'danger').length;
  const warningRiskCount = allRisks.filter((r) => r.severity === 'warning').length;

  const overallScore =
    recipeScores.length > 0
      ? Math.round(recipeScores.reduce((sum, s) => sum + s.totalScore, 0) / recipeScores.length)
      : 100;

  const memberCount = members.filter((m) => m.profile).length;
  const membersWithAnyRisk = new Set(allRisks.map((r) => r.memberId));
  const satisfiedPercentage =
    memberCount > 0
      ? Math.round(((memberCount - membersWithAnyRisk.size) / memberCount) * 100)
      : 100;

  const summary: string[] = [];
  if (criticalRiskCount > 0) {
    summary.push(`⚠️ 发现 ${criticalRiskCount} 项严重风险，请优先处理（过敏源/素食冲突等）`);
  }
  if (warningRiskCount > 0) {
    summary.push(`⚡ 有 ${warningRiskCount} 项需要注意的口味/健康不匹配`);
  }
  if (allRisks.length === 0 && memberCount > 0) {
    summary.push('✅ 所有菜品均适配当前家庭成员口味和健康要求');
  }
  if (memberCount === 0) {
    summary.push('💡 还没有成员设置口味画像，请先完善家庭成员信息');
  }

  return {
    feastId,
    overallScore,
    overallPercentage: satisfiedPercentage,
    totalRiskCount,
    criticalRiskCount,
    warningRiskCount,
    recipeScores,
    allRisks,
    summary,
  };
}

export { getDefaultRiskTags };
