const supabase = require('../supabaseClient');

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  // 1. Check if token exists
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authentication Token. You must be logged in.' });
  }

  const token = authHeader.split(' ')[1];
  
  // 2. Ask Supabase to mathematically verify the token signature
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return res.status(403).json({ error: 'Invalid or Expired Security Token.' });
  }

  // 3. Attach the verified user object to the request so routes can use it
  req.user = user;
  
  next(); // Allow the request to proceed to the API route!
}

module.exports = requireAuth;
