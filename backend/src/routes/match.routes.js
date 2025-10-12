import { Router } from 'express';
import { createMatch, listMatches, getMatch, startInnings, recordBall, undoLastBall } from '../services/match.service.js';

const router = Router();

router.post('/', async (req,res,next)=>{
  try { res.status(201).json(await createMatch(req.body)); } catch(e){ next(e); }
});

router.get('/', async (_req,res,next)=>{
  try { res.json(await listMatches()); } catch(e){ next(e); }
});

router.get('/:id', async (req,res,next)=>{
  try { res.json(await getMatch(req.params.id)); } catch(e){ next(e); }
});

router.post('/:id/innings/start', async (req,res,next)=>{
  try { res.json(await startInnings(req.params.id, req.body)); } catch(e){ next(e); }
});

router.post('/:id/ball', async (req,res,next)=>{
  try { res.json(await recordBall(req.params.id, req.body)); } catch(e){ next(e); }
});

router.post('/:id/undo', async (req,res,next)=>{
  try { res.json(await undoLastBall(req.params.id)); } catch(e){ next(e); }
});

export default router;
