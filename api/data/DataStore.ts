import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Recipe, Member, Feast, Review, CalculatedIngredient, PurchaseStatus, KitchenEquipment, StepType } from '../types/index.js';
import { initialRecipes, initialMembers, initialFeasts, initialReviews } from './initialData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

function inferEquipment(type: StepType, title: string, description: string): KitchenEquipment {
  const text = `${title || ''} ${description || ''}`;
  if (/蒸/.test(text)) return 'steamer';
  if (/烤箱|烤鸡|烤肉|烤/.test(text)) return 'oven';
  if (/电饭煲|煮饭|蒸饭/.test(text)) return 'rice-cooker';
  if (type === 'wash-cut' || type === 'prep') {
    if (/切|拍|剁|改刀|处理|备料|调|腌|剥|削|拍碎|切块/.test(text)) return 'cutting-board';
    return 'none';
  }
  if (/炒|煎|爆|煸|划散/.test(text)) return 'wok';
  if (/炖|煮|焖|烧|熬|卤|煲|红烧|收汁|糖醋/.test(text)) return 'pot';
  if (type === 'plating') return 'none';
  if (type === 'cooking') return 'wok';
  return 'none';
}

interface DataStoreData {
  recipes: Recipe[];
  members: Member[];
  feasts: Feast[];
  reviews: Review[];
}

class DataStore {
  private data: DataStoreData;
  private dataFile = path.join(DATA_DIR, 'db.json');

  constructor() {
    this.ensureDataDir();
    this.data = this.loadData();
  }

  private ensureDataDir(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private migrateData(data: DataStoreData): DataStoreData {
    const migratedFeasts = data.feasts.map((feast) => {
      const migratedIngredients = feast.ingredients.map((ing) => {
        if (!ing.purchaseStatus) {
          return {
            ...ing,
            purchaseStatus: 'pending' as PurchaseStatus,
          };
        }
        return ing;
      });
      return {
        ...feast,
        ingredients: migratedIngredients as CalculatedIngredient[],
      };
    });

    const migratedRecipes = (data.recipes || []).map((recipe) => {
      const steps = (recipe.steps || []).map((step) => ({
        ...step,
        equipment: (step.equipment ?? inferEquipment(step.type, step.title, step.description)) as KitchenEquipment,
        parallel: step.parallel ?? false,
      }));
      const hasCooking = steps.some((s) => s.type === 'cooking');
      const keepWarmDuration =
        recipe.keepWarmDuration ?? (hasCooking ? 30 : undefined);
      return { ...recipe, steps, keepWarmDuration };
    });

    return {
      ...data,
      recipes: migratedRecipes,
      feasts: migratedFeasts,
    };
  }

  private loadData(): DataStoreData {
    try {
      if (fs.existsSync(this.dataFile)) {
        const raw = fs.readFileSync(this.dataFile, 'utf-8');
        const parsed = JSON.parse(raw);
        const migrated = this.migrateData(parsed);
        if (JSON.stringify(migrated) !== JSON.stringify(parsed)) {
          this.saveData(migrated);
        }
        return migrated;
      }
    } catch (e) {
      console.error('Failed to load data, using initial data:', e);
    }
    const initialData: DataStoreData = {
      recipes: initialRecipes,
      members: initialMembers,
      feasts: initialFeasts,
      reviews: initialReviews,
    };
    const migratedInitial = this.migrateData(initialData);
    this.saveData(migratedInitial);
    return migratedInitial;
  }

  private saveData(data: DataStoreData): void {
    try {
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save data:', e);
    }
  }

  private persist(): void {
    this.saveData(this.data);
  }

  getRecipes(): Recipe[] {
    return this.data.recipes;
  }

  getRecipeById(id: string): Recipe | undefined {
    return this.data.recipes.find(r => r.id === id);
  }

  addRecipe(recipe: Recipe): Recipe {
    this.data.recipes.push(recipe);
    this.persist();
    return recipe;
  }

  updateRecipe(id: string, updates: Partial<Recipe>): Recipe | undefined {
    const index = this.data.recipes.findIndex(r => r.id === id);
    if (index === -1) return undefined;
    const updated = { ...this.data.recipes[index], ...updates, updatedAt: new Date().toISOString() };
    this.data.recipes[index] = updated;
    this.persist();
    return updated;
  }

  deleteRecipe(id: string): boolean {
    const index = this.data.recipes.findIndex(r => r.id === id);
    if (index === -1) return false;
    this.data.recipes.splice(index, 1);
    this.persist();
    return true;
  }

  getMembers(): Member[] {
    return this.data.members;
  }

  getMemberById(id: string): Member | undefined {
    return this.data.members.find(m => m.id === id);
  }

  addMember(member: Member): Member {
    this.data.members.push(member);
    this.persist();
    return member;
  }

  updateMember(id: string, updates: Partial<Member>): Member | undefined {
    const index = this.data.members.findIndex(m => m.id === id);
    if (index === -1) return undefined;
    const updated = { ...this.data.members[index], ...updates };
    this.data.members[index] = updated;
    this.persist();
    return updated;
  }

  deleteMember(id: string): boolean {
    const index = this.data.members.findIndex(m => m.id === id);
    if (index === -1) return false;
    this.data.members.splice(index, 1);
    this.persist();
    return true;
  }

  getFeasts(): Feast[] {
    return this.data.feasts;
  }

  getFeastById(id: string): Feast | undefined {
    return this.data.feasts.find(f => f.id === id);
  }

  addFeast(feast: Feast): Feast {
    this.data.feasts.push(feast);
    this.persist();
    return feast;
  }

  updateFeast(id: string, updates: Partial<Feast>): Feast | undefined {
    const index = this.data.feasts.findIndex(f => f.id === id);
    if (index === -1) return undefined;
    const updated = { ...this.data.feasts[index], ...updates };
    this.data.feasts[index] = updated;
    this.persist();
    return updated;
  }

  deleteFeast(id: string): boolean {
    const index = this.data.feasts.findIndex(f => f.id === id);
    if (index === -1) return false;
    this.data.feasts.splice(index, 1);
    this.persist();
    return true;
  }

  getReviews(): Review[] {
    return this.data.reviews;
  }

  getReviewsByRecipeId(recipeId: string): Review[] {
    return this.data.reviews.filter(r => r.recipeId === recipeId);
  }

  addReview(review: Review): Review {
    this.data.reviews.push(review);
    this.persist();
    return review;
  }
}

export const dataStore = new DataStore();
