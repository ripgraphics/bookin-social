import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const PERSONAL_EMAIL = 'bookin.social34@hotmail.com';
const TEST_PASSWORD = 'TestPMS2024!';

/**
 * GET /api/test-users
 * Returns all test users (excluding personal account) with their roles.
 * Only available in development mode.
 */
export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  try {
    const supabase = await createClient();

    // Get all users except personal account
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .neq('email', PERSONAL_EMAIL)
      .order('email');

    if (usersError) {
      throw usersError;
    }

    if (!usersData || usersData.length === 0) {
      return NextResponse.json({ users: [] });
    }

    // Get roles for each user
    const userIds = usersData.map(u => u.id);
    const { data: userRolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        role_id,
        roles (
          id,
          name,
          display_name
        )
      `)
      .in('user_id', userIds);

    if (rolesError) {
      throw rolesError;
    }

    // Group roles by user_id
    const rolesByUserId = new Map<string, any[]>();
    if (userRolesData) {
      userRolesData.forEach(ur => {
        if (!rolesByUserId.has(ur.user_id)) {
          rolesByUserId.set(ur.user_id, []);
        }
        if (ur.roles) {
          rolesByUserId.get(ur.user_id)!.push(ur.roles);
        }
      });
    }

    // Map users with their roles
    const users = usersData.map(user => ({
      id: user.id,
      email: user.email,
      fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'No name',
      firstName: user.first_name,
      lastName: user.last_name,
      roles: rolesByUserId.get(user.id) || [],
      password: TEST_PASSWORD, // Fixed password for all test accounts
    }));

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Error fetching test users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test users', details: error.message },
      { status: 500 }
    );
  }
}

