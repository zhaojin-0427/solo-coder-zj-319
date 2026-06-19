import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Recipe, Member, Feast, Review, CalculatedIngredient, PurchaseStatus } from '../types/index.js';
import { initialRecipes, initialMembers, initialFeasts, initialReviews } from './initialData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

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
    return {
      ...data,
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
    this.saveData(initialData);
    return initialData;
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
