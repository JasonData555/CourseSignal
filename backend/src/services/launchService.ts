import { query } from '../db/connection';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

export interface CreateLaunchDto {
  title: string;
  description?: string;
  start_date: Date;
  end_date: Date;
  revenue_goal?: number;
  sales_goal?: number;
}

export interface UpdateLaunchDto {
  title?: string;
  description?: string;
  start_date?: Date;
  end_date?: Date;
  revenue_goal?: number;
  sales_goal?: number;
}

export interface ShareOptions {
  password?: string;
  expiresAt?: Date;
}

export interface ListOptions {
  page?: number;
  limit?: number;
  status?: 'upcoming' | 'active' | 'completed' | 'archived' | 'all';
  sortBy?: 'start_date' | 'end_date' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Create a new launch and auto-assign matching purchases
 */
export async function createLaunch(userId: string, data: CreateLaunchDto) {
  // Validate date range
  if (data.end_date <= data.start_date) {
    throw new Error('End date must be after start date');
  }

  const result = await query(
    `INSERT INTO launches (user_id, title, description, start_date, end_date, revenue_goal, sales_goal)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, data.title, data.description, data.start_date, data.end_date, data.revenue_goal, data.sales_goal]
  );

  const launch = result.rows[0];

  // Auto-assign existing purchases to this launch
  await query(
    `UPDATE purchases
     SET launch_id = $1
     WHERE user_id = $2
       AND purchased_at BETWEEN $3 AND $4
       AND launch_id IS NULL`,
    [launch.id, userId, data.start_date, data.end_date]
  );

  // Update launch status if needed
  await updateLaunchStatusIfNeeded(launch.id);

  return launch;
}

/**
 * Get a single launch by ID
 */
export async function getLaunch(userId: string, launchId: string) {
  // Ensure status is current before returning
  await updateLaunchStatusIfNeeded(launchId);

  const result = await query(
    `SELECT l.*,
       (SELECT COUNT(*) FROM purchases WHERE launch_id = l.id) as purchase_count,
       (SELECT COALESCE(SUM(amount), 0) FROM purchases WHERE launch_id = l.id) as current_revenue
     FROM launches l
     WHERE l.id = $1 AND l.user_id = $2`,
    [launchId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Launch not found');
  }

  return result.rows[0];
}

/**
 * Update a launch
 */
export async function updateLaunch(userId: string, launchId: string, data: UpdateLaunchDto) {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    values.push(data.title);
  }

  if (data.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(data.description);
  }

  if (data.start_date !== undefined) {
    fields.push(`start_date = $${paramIndex++}`);
    values.push(data.start_date);
  }

  if (data.end_date !== undefined) {
    fields.push(`end_date = $${paramIndex++}`);
    values.push(data.end_date);
  }

  if (data.revenue_goal !== undefined) {
    fields.push(`revenue_goal = $${paramIndex++}`);
    values.push(data.revenue_goal);
  }

  if (data.sales_goal !== undefined) {
    fields.push(`sales_goal = $${paramIndex++}`);
    values.push(data.sales_goal);
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  fields.push(`updated_at = NOW()`);
  values.push(launchId, userId);

  const result = await query(
    `UPDATE launches
     SET ${fields.join(', ')}
     WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
     RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new Error('Launch not found');
  }

  // If dates changed, reassign purchases
  if (data.start_date || data.end_date) {
    const launch = result.rows[0];

    // Clear existing assignments for this launch
    await query('UPDATE purchases SET launch_id = NULL WHERE launch_id = $1', [launchId]);

    // Reassign based on new date range
    await query(
      `UPDATE purchases
       SET launch_id = $1
       WHERE user_id = $2
         AND purchased_at BETWEEN $3 AND $4`,
      [launch.id, userId, launch.start_date, launch.end_date]
    );
  }

  return result.rows[0];
}

/**
 * Delete a launch
 */
export async function deleteLaunch(userId: string, launchId: string) {
  const result = await query(
    'DELETE FROM launches WHERE id = $1 AND user_id = $2 RETURNING id',
    [launchId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Launch not found');
  }

  return { success: true };
}

/**
 * Archive a launch (soft delete)
 */
export async function archiveLaunch(userId: string, launchId: string) {
  const result = await query(
    `UPDATE launches
     SET status = 'archived', updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [launchId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Launch not found');
  }

  return result.rows[0];
}

/**
 * List launches with pagination and filtering
 */
export async function listLaunches(userId: string, options: ListOptions = {}) {
  const { page = 1, limit = 20, status = 'all', sortBy = 'start_date', sortOrder = 'desc' } = options;
  const offset = (page - 1) * limit;

  let whereClause = 'user_id = $1';
  const params: any[] = [userId];

  if (status !== 'all') {
    whereClause += ` AND status = $${params.length + 1}`;
    params.push(status);
  }

  // Validate sortBy to prevent SQL injection
  const allowedSortFields = ['start_date', 'end_date', 'created_at'];
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'start_date';
  const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const result = await query(
    `SELECT l.*,
       COUNT(*) OVER() as total_count,
       (SELECT COUNT(*) FROM purchases WHERE launch_id = l.id) as purchase_count,
       (SELECT COALESCE(SUM(amount), 0) FROM purchases WHERE launch_id = l.id) as current_revenue
     FROM launches l
     WHERE ${whereClause}
     ORDER BY ${safeSortBy} ${safeSortOrder}
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return {
    launches: result.rows,
    pagination: {
      page,
      limit,
      total: result.rows[0]?.total_count || 0,
      pages: Math.ceil((result.rows[0]?.total_count || 0) / limit),
    },
  };
}

/**
 * Enable sharing for a launch and generate share token
 */
export async function enableShare(userId: string, launchId: string, options?: ShareOptions) {
  const shareToken = uuidv4();
  let passwordHash = null;

  if (options?.password) {
    passwordHash = await bcrypt.hash(options.password, 10);
  }

  const result = await query(
    `UPDATE launches
     SET share_enabled = TRUE,
         share_token = $1,
         share_password_hash = $2,
         share_expires_at = $3,
         updated_at = NOW()
     WHERE id = $4 AND user_id = $5
     RETURNING *`,
    [shareToken, passwordHash, options?.expiresAt, launchId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Launch not found');
  }

  const launch = result.rows[0];

  return {
    shareToken,
    shareUrl: `${process.env.APP_URL}/public/launch/${shareToken}`,
    launch,
  };
}

/**
 * Disable sharing for a launch
 */
export async function disableShare(userId: string, launchId: string) {
  const result = await query(
    `UPDATE launches
     SET share_enabled = FALSE, updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [launchId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Launch not found');
  }

  return result.rows[0];
}

/**
 * Get public launch data by share token (no auth required)
 */
export async function getPublicLaunchData(shareToken: string, password?: string) {
  const result = await query(
    `SELECT l.*,
       (SELECT COUNT(DISTINCT email) FROM purchases WHERE launch_id = l.id) as total_students,
       (SELECT COALESCE(SUM(amount), 0) FROM purchases WHERE launch_id = l.id) as total_revenue,
       (SELECT COUNT(*) FROM purchases WHERE launch_id = l.id) as total_purchases
     FROM launches l
     WHERE share_token = $1 AND share_enabled = TRUE`,
    [shareToken]
  );

  if (result.rows.length === 0) {
    throw new Error('Launch not found or sharing disabled');
  }

  const launch = result.rows[0];

  // Check expiration
  if (launch.share_expires_at && new Date() > new Date(launch.share_expires_at)) {
    throw new Error('Share link has expired');
  }

  // Check password if set
  if (launch.share_password_hash && password) {
    const valid = await bcrypt.compare(password, launch.share_password_hash);
    if (!valid) {
      throw new Error('Invalid password');
    }
  } else if (launch.share_password_hash && !password) {
    throw new Error('Password required');
  }

  // Track view
  await query(
    'INSERT INTO launch_views (launch_id, share_token) VALUES ($1, $2)',
    [launch.id, shareToken]
  );

  return launch;
}

/**
 * Update launch status based on current date
 */
export async function updateLaunchStatusIfNeeded(launchId: string) {
  const now = new Date();

  await query(
    `UPDATE launches
     SET status = CASE
       WHEN start_date > $1 THEN 'upcoming'
       WHEN end_date < $1 THEN 'completed'
       ELSE 'active'
     END,
     updated_at = NOW()
     WHERE id = $2 AND status != 'archived'`,
    [now, launchId]
  );
}

/**
 * Update all launch statuses (called by background job)
 */
export async function updateAllLaunchStatuses() {
  const now = new Date();

  // Update upcoming → active
  const activeResult = await query(
    `UPDATE launches
     SET status = 'active', updated_at = NOW()
     WHERE status = 'upcoming' AND start_date <= $1
     RETURNING id`,
    [now]
  );

  // Update active → completed
  const completedResult = await query(
    `UPDATE launches
     SET status = 'completed', updated_at = NOW()
     WHERE status = 'active' AND end_date < $1
     RETURNING id`,
    [now]
  );

  return {
    activated: activeResult.rows.length,
    completed: completedResult.rows.length,
  };
}

/**
 * Duplicate a launch (copy settings, not data)
 */
export async function duplicateLaunch(userId: string, launchId: string) {
  const original = await getLaunch(userId, launchId);

  return createLaunch(userId, {
    title: `${original.title} (Copy)`,
    description: original.description,
    start_date: new Date(), // User will update these
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
    revenue_goal: original.revenue_goal,
    sales_goal: original.sales_goal,
  });
}

/**
 * Get view count for a launch
 */
export async function getLaunchViewCount(userId: string, launchId: string) {
  const result = await query(
    `SELECT COUNT(*) as view_count
     FROM launch_views lv
     JOIN launches l ON lv.launch_id = l.id
     WHERE lv.launch_id = $1 AND l.user_id = $2`,
    [launchId, userId]
  );

  return {
    viewCount: parseInt(result.rows[0].view_count),
  };
}
