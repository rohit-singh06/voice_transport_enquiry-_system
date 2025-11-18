# Login System Setup Instructions

## Database Setup

### 1. Run the database migration script

Execute the SQL script to create the users table:

```bash
psql -U postgres -d transport_db -f database_setup.sql
```

Or using pgAdmin or any PostgreSQL client, run the contents of `database_setup.sql`:

```sql
-- Create users table for authentication and preferences
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    language_preference VARCHAR(10) DEFAULT 'en',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

### 2. Verify the table was created

```sql
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'users';
```

## Running the Application

### 1. Start the Flask server

```bash
python app.py
```

### 2. Access the login page

Open your browser and navigate to:
```
http://localhost:5000/login
```

### 3. Create a new account

- Click on the "Sign Up" tab
- Fill in your details:
  - First Name (optional)
  - Last Name (optional)
  - Email Address (required)
  - Password (minimum 6 characters)
  - Language Preference (English or Hindi)
- Click "Create Account"

### 4. Sign in

- Use your email and password to sign in
- You'll be redirected to the main transport enquiry page

## Features

### User Authentication
- **Sign Up**: Create new user accounts with email and password
- **Sign In**: Login with existing credentials
- **Session Management**: Secure session-based authentication
- **Logout**: Clear session and redirect to login

### User Profile
- Email address
- Password (hashed using Werkzeug)
- Language preference (English/Hindi)
- First and Last name
- Last login timestamp
- Account status (active/inactive)

### Security Features
- Password hashing with Werkzeug's PBKDF2
- Session-based authentication with secret key
- Email uniqueness constraint
- Input validation (minimum password length, email format)
- Secure session management

## Database Schema

The `users` table includes:
- `user_id`: Primary key (auto-increment)
- `email`: Unique email address
- `password_hash`: Hashed password
- `language_preference`: User's preferred language (en/hi)
- `first_name`: First name
- `last_name`: Last name
- `phone_number`: Optional phone number
- `created_at`: Account creation timestamp
- `last_login`: Last login timestamp
- `is_active`: Account status

## Troubleshooting

### Database Connection Error
If you get a database connection error, make sure:
1. PostgreSQL is running
2. Database `transport_db` exists
3. User `postgres` has the correct password (update in app.py line 15)
4. The users table has been created

### Login Not Working
1. Verify the users table exists: `SELECT * FROM users;`
2. Check if your email exists: `SELECT email FROM users WHERE email = 'your-email@example.com';`
3. Ensure the Flask server is running without errors

### Session Issues
If you're being redirected to login after signing in:
1. Clear your browser cookies
2. Check that `app.secret_key` is set in app.py
3. Verify session is being created (check browser dev tools > Application > Cookies)

## Next Steps

After setting up authentication, you can:
1. Add more user fields as needed
2. Implement password reset functionality
3. Add email verification
4. Create user profile pages
5. Add role-based access control

