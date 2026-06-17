import { Router, type Request, type Response } from 'express';
import { dataStore } from '../data/DataStore.js';
import type { Member } from '../types/index.js';

const router = Router();

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const members = dataStore.getMembers();
    res.json({ success: true, data: members });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to get members' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const member = dataStore.getMemberById(id);
    if (!member) {
      res.status(404).json({ success: false, error: 'Member not found' });
      return;
    }
    res.json({ success: true, data: member });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to get member' });
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, role, avatar } = req.body as Partial<Member>;
    if (!name || name.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Name is required' });
      return;
    }
    const member: Member = {
      id: generateId('m'),
      name: name.trim(),
      role: role || '',
      avatar: avatar || '👤',
    };
    const saved = dataStore.addMember(member);
    res.json({ success: true, data: saved });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to create member' });
  }
});

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body as Partial<Member>;
    const updated = dataStore.updateMember(id, updates);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Member not found' });
      return;
    }
    res.json({ success: true, data: updated });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to update member' });
  }
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = dataStore.deleteMember(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Member not found' });
      return;
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to delete member' });
  }
});

export default router;
