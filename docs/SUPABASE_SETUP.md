# Supabase Setup Guide

This guide will help you set up Supabase for the Leo Club website.

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Node.js installed on your machine

## Step 1: Create a Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in your project details:
   - **Name**: Leo Club Website
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to your users
4. Click "Create new project" and wait for it to initialize

## Step 2: Run the Database Schema

1. In your Supabase project, go to the **SQL Editor** (left sidebar)
2. Click "New Query"
3. Copy the entire contents of `supabase_schema.sql` from the project root
4. Paste it into the SQL editor
5. Click "Run" to execute the schema

This will create:
- `projects` table with all necessary columns
- `leadership` table for team members
- Row Level Security (RLS) policies for public read access
- Sample data for testing

## Step 3: Get Your API Keys

1. In your Supabase project, go to **Settings** → **API**
2. Find these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (a long string starting with `eyJ...`)

## Step 4: Configure Environment Variables

1. In the project root, create a `.env` file (copy from `.env.example`)
2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 5: Test the Connection

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open the website and check if:
   - Projects load from Supabase
   - Leadership members display correctly
   - You can add/edit/delete items from the Admin Dashboard

## Database Structure

### Projects Table
- `id`: Auto-incrementing primary key
- `title`: Project name
- `category`: 'Completed', 'Ongoing', or 'Upcoming'
- `description`: Project details
- `image_url`: URL to project image
- `project_date`: Date of the project
- `recruitment_link`: Google Form link for upcoming projects
- `created_at`: Timestamp

### Leadership Table
- `id`: Auto-incrementing primary key
- `name`: Member name
- `position`: Role/position
- `role_type`: 'Executive' or 'Board'
- `image_url`: URL to member photo
- `year`: Academic year (e.g., '2024/2025')
- `created_at`: Timestamp

## Security Notes

### Row Level Security (RLS)

The database is configured with RLS policies:

- **Public Read Access**: Anyone can view projects and leadership data
- **Authenticated Write Access**: Only authenticated users can create/update/delete

For the admin dashboard to work, you'll need to:
1. Set up Supabase Auth (optional, for production)
2. Or temporarily disable RLS for testing (not recommended for production)

To disable RLS for testing:
```sql
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE leadership DISABLE ROW LEVEL SECURITY;
```

**Important**: Re-enable RLS before deploying to production!

## Troubleshooting

### "Missing Supabase environment variables" Error
- Make sure your `.env` file exists in the project root
- Check that variable names start with `VITE_`
- Restart the dev server after adding environment variables

### Data Not Loading
- Check browser console for errors
- Verify your Supabase URL and anon key are correct
- Ensure the database schema was executed successfully
- Check that RLS policies allow public read access

### Can't Add/Edit/Delete Items
- Check if RLS is blocking your requests
- Verify the API calls in the browser Network tab
- Look for error messages in the console

## Next Steps

1. **Add Authentication**: Implement Supabase Auth for secure admin access
2. **Image Upload**: Set up Supabase Storage for image uploads
3. **Real-time Updates**: Use Supabase Realtime for live data updates
4. **Deploy**: Deploy to Netlify/Vercel with environment variables

## Support

For more information, visit:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
