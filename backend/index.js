const express = require('express');
const cors = require('cors');
require('dotenv').config();
const supabase = require('./supabaseClient');
const requireAuth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware

app.use(cors());
app.use(express.json());

// Logger
app.use((req, res, next) => {
  console.log(`[API REQUEST] ${req.method} ${req.path}`);
  if (req.method !== 'GET') console.log('BODY:', req.body);
  next();
});

// Apply JWT Authentication to all /api routes!
app.use('/api', requireAuth);

// ==========================================
// TASKS REST API ROUTES
// ==========================================

app.get('/api/tasks', async (req, res) => {
  // SECURITY: Only fetch tasks where user_id matches the logged-in JWT user
  const { data, error } = await supabase.from('tasks').select('*').eq('user_id', req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.post('/api/tasks', async (req, res) => {
  const { date_key, name, priority, done, temp_id } = req.body;
  
  const { data, error } = await supabase.from('tasks')
    .insert([{ user_id: req.user.id, date_key, name, priority, done }])
    .select();
    
  if (error) return res.status(400).json({ error: error.message });
  if (!data || data.length === 0) return res.status(400).json({ error: 'Supabase RLS is blocking inserts!' });
  
  res.status(201).json({ ...data[0], temp_id }); 
});

app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { name, priority, done } = req.body;
  
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (priority !== undefined) updates.priority = priority;
  if (done !== undefined) updates.done = done;

  const { data, error } = await supabase.from('tasks')
    .update(updates)
    .eq('id', id)
    .eq('user_id', req.user.id) 
    .select();
    
  if (error) return res.status(400).json({ error: error.message });
  res.json(data ? data[0] : {});
});

app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('tasks').delete().eq('id', id).eq('user_id', req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Task deleted successfully' });
});

// ==========================================
// HABITS REST API ROUTES
// ==========================================

app.get('/api/habits', async (req, res) => {
  const { data: habits, error: hError } = await supabase.from('habits').select('*').eq('user_id', req.user.id);
  if (hError) return res.status(400).json({ error: hError.message });
  
  const { data: checks, error: cError } = await supabase.from('habit_checks').select('*').eq('user_id', req.user.id);
  if (cError) return res.status(400).json({ error: cError.message });

  const formattedHabits = habits.map(habit => {
    const checksObj = {};
    checks.filter(c => c.habit_id === habit.id).forEach(c => {
      checksObj[c.date_key] = c.completed;
    });
    return { ...habit, checks: checksObj };
  });

  res.json(formattedHabits);
});

app.post('/api/habits', async (req, res) => {
  const { name, goal } = req.body;
  const { data, error } = await supabase.from('habits')
    .insert([{ user_id: req.user.id, name, goal }])
    .select();
  if (error) return res.status(400).json({ error: error.message });
  if (!data || data.length === 0) return res.status(400).json({ error: 'Supabase RLS is blocking inserts!' });
  
  res.status(201).json({ ...data[0], checks: {} });
});

app.put('/api/habits/:id', async (req, res) => {
  const { id } = req.params;
  const { name, goal } = req.body;
  
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (goal !== undefined) updates.goal = goal;

  const { data, error } = await supabase.from('habits').update(updates).eq('id', id).eq('user_id', req.user.id).select();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});

app.post('/api/habits/delete-multiple', async (req, res) => {
  const { ids } = req.body;
  const { error } = await supabase.from('habits').delete().in('id', ids).eq('user_id', req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Habits deleted' });
});

app.post('/api/habits/:id/toggle', async (req, res) => {
  const { id } = req.params;
  const { date_key } = req.body;
  
  const { data: existing } = await supabase.from('habit_checks')
      .select('*')
      .eq('habit_id', id)
      .eq('date_key', date_key)
      .eq('user_id', req.user.id)
      .single();

  if (existing) {
    const { data, error } = await supabase.from('habit_checks')
      .update({ completed: !existing.completed })
      .eq('id', existing.id)
      .select();
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data[0]);
  } else {
    const { data, error } = await supabase.from('habit_checks')
      .insert([{ habit_id: id, user_id: req.user.id, date_key, completed: true }])
      .select();
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data[0]);
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`✅ Secured Backend API Server running on http://localhost:${PORT}`);
});
